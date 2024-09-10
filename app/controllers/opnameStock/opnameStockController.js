import stream from 'stream'
import axios from 'axios'
import { Op } from 'sequelize'

import models from '../../models'
import { getOpnameCategoryLabel, OPNAME_CATEGORY, USER_ROLE } from '../../helpers/constants'
import { getSmileHeader } from '../../helpers/integrations/smileIntegrationHelper'
import { opnameStockWorkbook } from '../../helpers/xls/excelTemplate'

const { sequelize } = models

export async function list(req, res, next) {
  try {
    // list
    const {
      material_id, entity_tag_ids, start_date, end_date, created_from, created_to,
    } = req.query
    const { province_id, regency_id } = req.query
    let { entity_id } = req.query
    const { user } = req

    const conditions = []
    req.include = [{
      association: 'entity',
      attributes: ['id', 'name'],
    },
    {
      association: 'material',
      attributes: ['id', 'name', 'code'],
    }]

    if (start_date) conditions.push({ start_date: { [Op.gte]: `${start_date} 00:00:00` } })
    if (end_date) conditions.push({ end_date: { [Op.lte]: `${end_date} 23:59:59` } })
    if (created_from) conditions.push({ created_at: { [Op.gte]: `${created_from} 00:00:00` } })
    if (created_to) conditions.push({ created_at: { [Op.lte]: `${created_to} 23:59:59` } })
    if (material_id) conditions.push({ material_id })
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
    if (entityConditions) req.include[0].where = entityConditions

    req.condition = conditions
    req.order = [['id', 'DESC']]

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function listOpnameReason(req, res, next){
  try{
    req.mappingDocs = ({ docs }) => docs.map((data) =>{
      let item = {
        ...data.dataValues
      }
      item.title = req.__(`reconciliation.reason.${item.id}`)
      return item
    })

    next()
  }catch(err){
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    req.include = [{
      association: 'entity',
      attributes: ['id', 'name'],
    },
    {
      association: 'material',
      attributes: ['id', 'name', 'code'],
    }]

    return next()
  } catch (err) {
    return next(err)
  }
}

function mappingDashboardKey(opnameKey) {
  switch (opnameKey) {
  case OPNAME_CATEGORY.CONSUMPTION:
    return 'consumption'
  case OPNAME_CATEGORY.DEFECT:
    return 'defect'
  case OPNAME_CATEGORY.FINAL_STOCK:
    return 'final_stock'
  case OPNAME_CATEGORY.RECEIPT:
    return 'receipt'
  case OPNAME_CATEGORY.DISTRIBUTION:
    return 'distribution'
  }
}

async function getOpnameStockFromDashboard(param) {
  const { SMILE_URL } = process.env
  // const { ADMIN_USER } = process.env
  // const { ADMIN_PASS } = process.env

  const {
    start_date, end_date, material_id, entity_id, entity, user,
  } = param
  const entityTags = entity.entity_tags.map((el) => el.id).join(',')

  // const headers = await getSmileHeader(ADMIN_USER, ADMIN_PASS)
  const headers = {
    Authorization: `Bearer ${user.token_login}`,
  }
  const params = {
    materialIds: material_id,
    entityIds: entity_id,
    provinceIds: entity.province_id,
    regencyIds: entity.regency_id,
    from: start_date,
    to: end_date,
    entityTags,
  }
  const dashboardData = await axios({
    method: 'GET',
    url: `${SMILE_URL}/dashboard-covid-v2/simple-transaction`,
    headers,
    params,
  })

  const dashboardQty = dashboardData.data.data[0]
  const opnameStockItems = []
  Object.keys(OPNAME_CATEGORY).forEach((objKey) => {
    const objValue = OPNAME_CATEGORY[objKey]
    const dashboardKey = mappingDashboardKey(objValue)
    opnameStockItems.push({
      stock_category: objValue,
      stock_category_label: getOpnameCategoryLabel(objValue),
      smile_qty: dashboardQty[dashboardKey],
      real_qty: 0,
      reasons: [],
      actions: [],
    })
  })
  return opnameStockItems
}

export async function generate(req, res, next) {
  try {
    const {
      start_date, end_date, material_id, entity_id,
    } = req.query
    const { user } = req
    const entity = await models.Entity.findByPk(entity_id)

    const generated = {
      material_id,
      entity_id,
      start_date,
      end_date,
    }

    generated.opname_stock_items = await getOpnameStockFromDashboard({ ...req.query, entity, user })

    return res.status(200).json(
      generated,
    )
  } catch (err) {
    return next(err)
  }
}

function getOpnameStockData(body) {
  const {
    material_id, entity_id, start_date, end_date,
  } = body
  return {
    material_id,
    entity_id,
    start_date,
    end_date,
  }
}

function prepareOpnameStockItems({ opname_stock_id, items = [], user = null }) {
  const returnItem = []
  for (const item of items) {
    let {
      stock_category, real_qty, smile_qty, reasons, actions,
    } = item
    real_qty = parseFloat(real_qty)
    returnItem.push({
      opname_stock_id,
      smile_qty,
      real_qty,
      stock_category,
      stock_category_label: getOpnameCategoryLabel(stock_category),
      created_by: user.id,
      reasons,
      actions,
    })
  }
  return returnItem
}

function prepareOpnameItemReason({ items = [] }) {
  const itemReasonActions = []
  for (const item of items) {
    const { reasons, actions } = item
    reasons.forEach((reason, reasonIdx) => {
      itemReasonActions.push({
        opname_stock_item_id: item.id,
        opname_reason_id: reason.id,
        opname_action_id: actions[reasonIdx].id,
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
    const { opname_stock_items } = body
    const createBody = getOpnameStockData(body)
    createBody.created_by = user.id

    const opnameStock = await models.OpnameStock.create(createBody, { transaction: t })
    const opnameStockItems = prepareOpnameStockItems({
      opname_stock_id: opnameStock.id,
      items: opname_stock_items,
      user,
    })
    let createdItems = await models.OpnameStockItem.bulkCreate(opnameStockItems,
      {
        returning: true,
        transaction: t,
      })

    // insert reason & action to opname_stock_item
    createdItems = createdItems.map((created) => {
      const { reasons, actions } = opnameStockItems.find((el) => el.stock_category === created.stock_category)
      return {
        ...created.dataValues,
        reasons,
        actions,
      }
    })

    // prepare & insert action & reason
    const createdReasonAction = prepareOpnameItemReason({
      items: createdItems,
    })
    await models.OpnameItemReasonAction.bulkCreate(createdReasonAction, { transaction: t })
    // console.log('Created items--------------------', createdItems)

    await t.commit()

    return res.status(201).json({
      id: opnameStock.id,
      ...opnameStock.dataValues,
      opname_stock_items: opnameStockItems,
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
    const opnameStocks = await models.OpnameStock.findAll(options)

    const workbook = await opnameStockWorkbook(opnameStocks)

    const timestamp = Date()
    const filename = `Reconciliation (${timestamp})`

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
