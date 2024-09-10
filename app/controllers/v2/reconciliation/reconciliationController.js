import stream from 'stream'
import axios from 'axios'
import { Op } from 'sequelize'

import models from '../../../models'
import { getRekonCategoryString, REKONSILIASI_CATEGORY } from '../../../helpers/constants'
import errorResponse from '../../../helpers/errorResponse'
import { reconciliationWorkbook } from './reconciliationWorkbook'
import { getTransactionTableData } from '../../../helpers/warehouse/dashboardCovid'

const { sequelize } = models

function getRelationsOptions() {
  const userFields = ['created_by', 'updated_by']
  let includeQuery = [{
    association: 'entity',
    attributes: ['id', 'name'],
  },
  {
    association: 'material',
    attributes: ['id', 'name', 'code'],
    paranoid: false
  }, {
    association: 'activity',
    attributes: ['id', 'name'],
    paranoid : false
  }, {
    association: 'reconciliation_items',
    attributes: models.ReconciliationItem.getBasicAttribute(),
    separate: true,
    include: [{
      association: 'reason_actions',
      include: [{
        association: 'reason',
        attributes: ['id', 'title']
      }, {
        association: 'action',
        attributes: ['id', 'title']
      }]
    }]
  }, 
  ...userFields.map(item => ({
    association: `user_${item}`,
    attributes: ['id', 'username', 'email', 'firstname', 'lastname']
  }))
  ]
  return includeQuery
}

const mappingData = ({ data, req }) => {
  let { reconciliation_items = [] } = data
  reconciliation_items = reconciliation_items.map((item) => { 
    let categoryString = getRekonCategoryString(item.stock_category)
    let reasons = []
    let actions = []
    item.dataValues.stock_category_label = req.__(`reconciliation.category.${categoryString}`)
    item.dataValues.reason_actions.forEach(reason => {
      // translate reason
      reasons.push({
        ...reason.reason.dataValues,
        title: req.__(`reconciliation.reason.${reason.reason.id}`)
      })
      // translate action
      actions.push({
        ...reason.action.dataValues,
        title: req.__(`reconciliation.action.${reason.action.id}`)
      })
    })
    item.dataValues.reasons = reasons
    item.dataValues.actions = actions
    delete item.dataValues.reason_actions
    return item
  })
  return {
    ...data.dataValues,
    reconciliation_items,
  }
}

export async function list(req, res, next) {
  try {
    // list
    let {
      material_id, entity_tag_ids, start_date, end_date, 
      created_from, created_to, activity_id, 
      entity_id, province_id, regency_id, is_vaccine
    } = req.query
    const { user } = req

    const conditions = []
    req.include = getRelationsOptions()

    if (start_date) conditions.push({ start_date: { [Op.gte]: `${start_date} 00:00:00` } })
    if (end_date) conditions.push({ end_date: { [Op.lte]: `${end_date} 23:59:59` } })
    if (created_from) conditions.push({ created_at: { [Op.gte]: `${created_from} 00:00:00` } })
    if (created_to) conditions.push({ created_at: { [Op.lte]: `${created_to} 23:59:59` } })
    if (material_id) conditions.push({ master_material_id: material_id })
    if (activity_id) conditions.push({ activity_id })
    if (entity_id) conditions.push({ entity_id })
    if (entity_tag_ids) {
      const arrEntityTag = entity_tag_ids.split(',')
      req.include[0].include = {
        association: 'entity_tags',
        attributes: ['id', 'title'],
        where: { id: { [Op.in]: arrEntityTag } },
      }
    }
    const entityConditions = []
    if (province_id) entityConditions.push({ province_id })
    if (regency_id) entityConditions.push({ regency_id })
    if (entityConditions.length > 0) req.include[0].where = entityConditions

    const materialConditions = []
    if (is_vaccine) materialConditions.push({ is_vaccine })
    if (materialConditions.length > 0) {
      req.include[1].where = materialConditions
      req.include[1].required = true
    }

    req.condition = conditions
    req.order = [['id', 'DESC']]

    req.mappingDocs = ({ docs }) => docs.map((reconciliation) => {
      return mappingData({data: reconciliation, req})
    })

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    req.include = getRelationsOptions()

    req.mappingData = mappingData

    return next()
  } catch (err) {
    return next(err)
  }
}

function mappingDashboardKey(opnameKey) {
  switch (opnameKey) {
  case REKONSILIASI_CATEGORY.RECEIVED:
    return 'receivedQty'
  case REKONSILIASI_CATEGORY.RETURN:
    return 'returnQty'
  case REKONSILIASI_CATEGORY.DISTRIBUTION:
    return 'distributedQty'
  case REKONSILIASI_CATEGORY.RECEIVED_RETURN:
    return 'receivedReturnQty'
  case REKONSILIASI_CATEGORY.CONSUMED:
    return 'consumedQty'
  case REKONSILIASI_CATEGORY.DEFECT:
    return 'defectQty'
  case REKONSILIASI_CATEGORY.REMAINING:
    return 'remainingQty'
  }
}

async function getOpnameStockFromDashboard({ param, res }) {
  const { SMILE_URL } = process.env

  const {
    start_date, end_date, material_id, entity_id, entity, user, activity_id
  } = param
  const masterMaterial = await models.MasterMaterial.findByPk(material_id)
  if(!masterMaterial) return res.status(400).json(errorResponse('Error Material not found'))
  
  const headers = {
    Authorization: `Bearer ${user.token_login}`,
  }
  const params = {
    masterMaterialId: material_id,
    entityId: entity_id,
    provinceId: entity.province_id,
    regencyId: entity.regency_id,
    from: start_date,
    to: end_date,
    isVaccine: masterMaterial.is_vaccine,
    activityId: activity_id,
    page: 1,
    limit: 50,
  }
  try {
    const dashboardData = await axios({
      method: 'GET',
      url: `${SMILE_URL}/warehouse-report/dashboard/covid/transaction`,
      headers,
      params,
    })
  
    const dashboardQty = dashboardData.data?.data[0] || []
    const opnameStockItems = []

    Object.keys(REKONSILIASI_CATEGORY).forEach((objKey) => {
      const objValue = REKONSILIASI_CATEGORY[objKey]
      const dashboardKey = mappingDashboardKey(objValue)
      opnameStockItems.push({
        stock_category: objValue,
        stock_category_label: res.__(`reconciliation.category.${getRekonCategoryString(objValue)}`),
        smile_qty: dashboardQty ? dashboardQty[dashboardKey] : 0,
        real_qty: 0,
        reasons: [],
        actions: [],
      })
    })
    return opnameStockItems
  } catch(err) {
    let msg = err.response?.data?.message || 'unknown'
    if(err.response) throw Error(`Error from report, ${msg}`)
    throw err
  }
}

export async function generate(req, res, next) { 
  try {
    const {
      start_date, end_date, material_id, entity_id, activity_id
    } = req.query
    const { user } = req
    const entity = await models.Entity.findByPk(entity_id)

    const generated = {
      material_id,
      entity_id,
      start_date,
      end_date,
      activity_id,
    }

    generated.reconciliation_items = await getOpnameStockFromDashboard({ param: { ...req.query, entity, user }, res })

    return res.status(200).json(
      generated,
    )
  } catch (err) {
    return next(err)
  }
}

function getReconciliationData(body) {
  const {
    material_id, entity_id, start_date, end_date, activity_id
  } = body
  return {
    master_material_id: material_id,
    entity_id,
    activity_id,
    start_date,
    end_date,
  }
}

function prepareReconciliationItems({ reconciliation_id, items = [], user = null, res }) {
  const returnItem = []
  for (const item of items) {
    let {
      stock_category, real_qty, smile_qty, reasons, actions,
    } = item
    real_qty = parseFloat(real_qty)
    returnItem.push({
      reconciliation_id,
      smile_qty,
      real_qty,
      stock_category,
      stock_category_label: res.__(`reconciliation.category.${getRekonCategoryString(stock_category)}`),
      created_by: user.id,
      reasons,
      actions,
    })
  }
  return returnItem
}

function prepareRekonItemReason({ items = [] }) {
  const itemReasonActions = []
  for (const item of items) {
    const { reasons, actions } = item
    reasons.forEach((reason, reasonIdx) => {
      itemReasonActions.push({
        reconciliation_item_id: item.id,
        reason_id: reason.id,
        action_id: actions[reasonIdx].id,
      })
    })
  }
  return itemReasonActions
}

export async function create(req, res, next) {
  const t = await sequelize.transaction()
  try {
    // create
    const { user, body } = req
    const { reconciliation_items } = body
    const createBody = getReconciliationData(body)
    createBody.created_by = user.id

    const reconciliation = await models.Reconciliation.create(createBody, { transaction: t })
    const reconciliationItems = prepareReconciliationItems({
      reconciliation_id: reconciliation.id,
      items: reconciliation_items,
      user,
      res
    })
    let createdItems = await models.ReconciliationItem.bulkCreate(reconciliationItems,
      {
        returning: true,
        transaction: t,
      })

    // insert reason & action to opname_stock_item
    createdItems = createdItems.map((created) => {
      const { reasons, actions } = reconciliationItems.find((el) => el.stock_category === created.stock_category)
      return {
        ...created.dataValues,
        reasons,
        actions,
      }
    })

    // prepare & insert action & reason
    const createdReasonAction = prepareRekonItemReason({
      items: createdItems,
    })
    await models.ReconciliationItemReasonAction.bulkCreate(createdReasonAction, { transaction: t })

    await t.commit()

    return res.status(201).json({
      id: reconciliation.id,
      ...reconciliation.dataValues,
      reconciliation_items: reconciliationItems,
    })
  } catch (err) {
    console.log(err)
    await t.rollback()

    return next(err)
  }
}

export async function exportExcel(req, res, next) {
  try {
    const {
      order, attributes, condition, customOptions, include,
    } = req

    const options = {
      order,
      attributes,
      where: condition,
      ...customOptions,
      include,
    }
    const opnameStocks = await models.Reconciliation.findAll(options)

    const workbook = await reconciliationWorkbook(opnameStocks, res)

    const timestamp = Date()
    const filename = `${req.__('report_header.reconciliation.filename')} (${timestamp})`

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const readStream = new stream.PassThrough()
    readStream.end(arrayBuffer)
    res.writeHead(200, {
      'Content-Length': arrayBuffer.length,
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      'Access-Control-Expose-Headers': 'Filename',
      Filename: `${filename}.xlsx`,
    })

    return readStream.pipe(res)
  } catch (error) {
    return next(error)
  }
}


async function getOpnameStockFromDashboardV2({ param, res }) {
  const {
    start_date, end_date, material_id, entity_id, entity, user, activity_id
  } = param
  const masterMaterial = await models.MasterMaterial.findByPk(material_id)
  if(!masterMaterial) return res.status(400).json(errorResponse('Error Material not found'))
  
  const params = {
    materialIds: material_id,
    entityIds: entity_id,
    provinceIds: entity.province_id,
    regencyIds: entity.regency_id,
    from: start_date,
    to: end_date,
    isVaccine: masterMaterial.is_vaccine,
    activityId: activity_id,
    page: 1,
    limit: 50,
  }

  param.query = params

  try {
    const datas = await getTransactionTableData({query : params, user})

    const dashboardQty = datas?.data[0] || []
    const opnameStockItems = []

    Object.keys(REKONSILIASI_CATEGORY).forEach((objKey) => {
      const objValue = REKONSILIASI_CATEGORY[objKey]
      const dashboardKey = mappingDashboardKey(objValue)
      opnameStockItems.push({
        stock_category: objValue,
        stock_category_label: res.__(`reconciliation.category.${getRekonCategoryString(objValue)}`),
        smile_qty: dashboardQty ? dashboardQty[dashboardKey] : 0,
        real_qty: 0,
        reasons: [],
        actions: [],
      })
    })
    return opnameStockItems
  } catch(err) {
    console.log('err', err)
    let msg = err.response?.data?.message || 'unknown'
    if(err.response) throw Error(`Error from report, ${msg}`)
    throw err
  }
}

export async function generateV2(req, res, next) { 
  try {
    const {
      start_date, end_date, material_id, entity_id, activity_id
    } = req.query
    const { user } = req
    const entity = await models.Entity.findByPk(entity_id)

    const generated = {
      material_id,
      entity_id,
      start_date,
      end_date,
      activity_id,
    }

    generated.reconciliation_items = await getOpnameStockFromDashboardV2({ param: { ...req.query, entity, user }, res })

    return res.status(200).json(
      generated,
    )
  } catch (err) {
    return next(err)
  }
}