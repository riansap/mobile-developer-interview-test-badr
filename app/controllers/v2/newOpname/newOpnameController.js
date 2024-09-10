/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { Op, QueryTypes } from 'sequelize'
import stream from 'stream'

import models from '../../../models'
import { newOpnameWorkbook } from './newOpnameWorkbook'

import listResponse from '../../../helpers/listResponse'

import _ from 'lodash'

const { sequelize } = models

export async function list(req, res, next) {
  try {
    // list
    const {
      entity_id, created_from, created_to,
      material_id, province_id, regency_id,
      batch_code, expired_from, expired_to,
      entity_tag_id, only_have_qty, activity_id,
      is_vaccine, period_id
    } = req.query
    const { user } = req

    const conditions = []
    if (created_from) conditions.push({ created_at: { [Op.gte]: `${created_from} 00:00:00` } })
    if (created_to) conditions.push({ created_at: { [Op.lte]: `${created_to} 23:59:59` } })
    if (batch_code) conditions.push({ batch_code: { [Op.like]: `%${batch_code}%` } })
    if (expired_from) conditions.push({ expired_date: { [Op.gte]: `${expired_from} 00:00:00` } })
    if (expired_to) conditions.push({ expired_date: { [Op.lte]: `${expired_to} 23:59:59` } })
    if (parseInt(only_have_qty) === 1) {
      conditions.push({
        [Op.or]: {
          smile_qty: { [Op.gt]: 0 },
          real_qty: { [Op.gt]: 0 },
          unsubmit_distribution_qty: { [Op.gt]: 0 },
          unsubmit_return_qty: { [Op.gt]: 0 },
        },
      })
    }

    const newOpnameItem = {}
    if (material_id) newOpnameItem.where = { master_material_id: material_id }

    const newOpname = {}
    const newOpnameCondition = []
    /*conditions.push(
      { 
        created_at: [
          sequelize.literal('SELECT MAX(op2.created_at) FROM new_opname_stocks as op2 INNER JOIN new_opname_items as oi2 ON oi2.id = op2.new_opname_item_id WHERE op2.batch_code <=> `NewOpnameStock`.`batch_code` AND oi2.master_material_id = `new_opname_item`.`master_material_id`')
        ],
      }
    )*/
    if (entity_id) newOpnameCondition.push({ entity_id })
    if (period_id) newOpnameCondition.push({ period_id })
    if (activity_id) newOpnameCondition.push({ activity_id })
    if (newOpnameCondition.length > 0) newOpname.where = newOpnameCondition

    const conditionEntity = []
    const entity = {
      include: [{
        association: 'province',
        attributes: ['id', 'name'],
      }, {
        association: 'regency',
        attributes: ['id', 'name'],
      }],
    }
    if (province_id) conditionEntity.push({ province_id })
    if (regency_id) conditionEntity.push({ regency_id })
    if (conditionEntity.length > 0) entity.where = conditionEntity

    if (entity_tag_id) {
      entity.include.push({
        association: 'entity_tags',
        attributes: ['id'],
      })
      conditions.push({ '$new_opname_item.new_opname.entity.entity_tags.id$': entity_tag_id })
    }

    const materialCondition = {}
    if (is_vaccine !== null && is_vaccine !== undefined) materialCondition.where = { is_vaccine }

    req.include = [{
      association: 'new_opname_item',
      ...newOpnameItem,
      required: true,
      requiredOnCount: true,
      include: [{
        association: 'new_opname',
        ...newOpname,
        required: true,
        include: [{
          association: 'entity',
          attributes: ['id', 'name'],
          ...entity,
        }, {
          association: 'activity',
          attributes: ['id', 'name'],
          paranoid: false
        }, {
          association: 'user_created_by',
          attributes: ['id', 'username', 'email', 'firstname', 'lastname'],
        }, {
          association: 'user_updated_by',
          attributes: ['id', 'username', 'email', 'firstname', 'lastname'],
        }, {
          association: 'period',
          attributes: ['id', 'start_date', 'end_date', 'status', 'month_periode', 'year_periode']
        }],
      },
      {
        association: 'master_material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        ...materialCondition,
      }],
    }]
    req.condition = conditions
    req.order = [['updated_at', 'DESC']]
    req.customOptions = { subQuery: false }
    req.mappingDocs = ({ docs }) => docs.map((stock) => {
      const {
        new_opname_item, batch_code,
        expired_date, smile_qty, real_qty,
        unsubmit_distribution_qty, unsubmit_return_qty,
        updated_at
      } = stock
      const { master_material, new_opname } = new_opname_item
      const { period } = new_opname
      const month = (period?.month_periode ? req.__(`months.${period?.month_periode}`) + ' ' : '')
      const year = (period?.year_periode || '')
      if (period)
        period.dataValues.periode_data = month + year
      return {
        id: new_opname.id,
        entity: new_opname.entity,
        activity: new_opname.activity,
        material: master_material,
        batch_code,
        expired_date,
        smile_qty,
        real_qty,
        unsubmit_distribution_qty,
        unsubmit_return_qty,
        created_at: new_opname.created_at,
        updated_at: updated_at, //from updated at new opname stock
        user_created_by: new_opname.user_created_by,
        user_updated_by: new_opname.user_updated_by,
        opname_period: period,
        period_id: new_opname.period_id,
        status: new_opname.status
      }
    })

    return next()
  } catch (err) {
    return next(err)
  }
}


export async function listTemp(req, res, next) {
  try {
    // list
    const {
      entity_id, created_from, created_to,
      material_id, province_id, regency_id,
      batch_code, expired_from, expired_to,
      entity_tag_id, only_have_qty, activity_id,
      is_vaccine,
    } = req.query
    const { user } = req

    const conditions = []
    if (created_from) conditions.push({ created_at: { [Op.gte]: `${created_from} 00:00:00` } })
    if (created_to) conditions.push({ created_at: { [Op.lte]: `${created_to} 23:59:59` } })
    if (batch_code) conditions.push({ batch_code: { [Op.like]: `%${batch_code}%` } })
    if (expired_from) conditions.push({ expired_date: { [Op.gte]: `${expired_from} 00:00:00` } })
    if (expired_to) conditions.push({ expired_date: { [Op.lte]: `${expired_to} 23:59:59` } })
    if (parseInt(only_have_qty) === 1) {
      conditions.push({
        [Op.or]: {
          smile_qty: { [Op.gt]: 0 },
          real_qty: { [Op.gt]: 0 },
          unsubmit_distribution_qty: { [Op.gt]: 0 },
          unsubmit_return_qty: { [Op.gt]: 0 },
        },
      })
    }

    const newOpnameItem = {}
    if (material_id) newOpnameItem.where = { master_material_id: material_id }

    const newOpname = {}
    const newOpnameCondition = []
    /*conditions.push(
      { 
        created_at: [
          sequelize.literal('SELECT MAX(op2.created_at) FROM new_opname_stocks as op2 INNER JOIN new_opname_items as oi2 ON oi2.id = op2.new_opname_item_id WHERE op2.batch_code <=> `NewOpnameStock`.`batch_code` AND oi2.master_material_id = `new_opname_item`.`master_material_id`')
        ],
      }
    )*/
    if (entity_id) newOpnameCondition.push({ entity_id })
    if (activity_id) newOpnameCondition.push({ activity_id })
    if (newOpnameCondition.length > 0) newOpname.where = newOpnameCondition

    const conditionEntity = []
    const entity = {
      include: [{
        association: 'province',
        attributes: ['id', 'name'],
      }, {
        association: 'regency',
        attributes: ['id', 'name'],
      }],
    }
    if (province_id) conditionEntity.push({ province_id })
    if (regency_id) conditionEntity.push({ regency_id })
    if (conditionEntity.length > 0) entity.where = conditionEntity

    if (entity_tag_id) {
      entity.include.push({
        association: 'entity_tags',
        attributes: ['id'],
      })
      conditions.push({ '$new_opname_item.new_opname.entity.entity_tags.id$': entity_tag_id })
    }

    const materialCondition = {}
    if (is_vaccine !== null && is_vaccine !== undefined) materialCondition.where = { is_vaccine }

    var include = [{
      association: 'new_opname_item',
      ...newOpnameItem,
      required: true,
      requiredOnCount: true,
      include: [{
        association: 'new_opname',
        ...newOpname,
        required: true,
        include: [{
          association: 'entity',
          attributes: ['id', 'name'],
          ...entity,
        }, {
          association: 'activity',
          attributes: ['id', 'name'],
          paranoid: false
        }, {
          association: 'user_created_by',
          attributes: ['id', 'username', 'email', 'firstname', 'lastname'],
        }],
      },
      {
        association: 'master_material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        ...materialCondition,
      }],
    }]
    var condition = conditions
    var order = [['id', 'DESC']]
    var customOptions = { subQuery: false }

    var mappingDocs = ({ docs }) => docs.map((stock) => {
      const {
        new_opname_item, batch_code,
        expired_date, smile_qty, real_qty,
        unsubmit_distribution_qty, unsubmit_return_qty,
      } = stock
      const { master_material, new_opname } = new_opname_item
      return {
        id: new_opname?.id,
        entity: new_opname?.entity,
        activity: new_opname?.activity,
        material: master_material,
        batch_code,
        expired_date,
        smile_qty,
        real_qty,
        unsubmit_distribution_qty,
        unsubmit_return_qty,
        created_at: new_opname?.created_at,
        user_created_by: new_opname?.user_created_by,
      }
    })

    let { page, paginate } = req.query
    if (!page || page === '') page = 1
    if (!paginate || paginate === '') paginate = 10
    console.log(page)
    const options = {
      include,
      order,
      limit: Number(paginate),
      offset: (Number(page) - 1) * Number(paginate),
      where: condition,
      duplicating: false,
      ...customOptions,
    }

    const data = await models.NewOpnameStock.findAndCountAll(options)
    if (data.rows.length <= 0) {
      var error = new Error(req.__('204'))
      error.status = 204
      throw error
    }
    let docs = data.rows
    const total = data.count

    docs = mappingDocs({ docs })

    return res.status(200).json(listResponse(total, page, paginate, docs))

    //return next()
  } catch (err) {
    return next(err)
  }
}

async function getCreateData({ body, user, isUpdate = false }) {
  let { new_opname_items, entity_id, activity_id, period_id } = body
  const existBatchIds = []
  let status = 0
  new_opname_items = new_opname_items.map((item) => ({
    id: isUpdate ? item.id : null,
    material_id: item.material_id,
    new_opname_stocks: item.new_opname_stocks.map((stock) => {
      existBatchIds.push(stock.batch_id)
      return {
        id: isUpdate ? stock.id : null,
        stock_id: stock.stock_id || null,
        batch_id: stock.batch_id || null,
        batch_code: stock.batch_code || null,
        expired_date: stock.expired_date || null,
        smile_qty: stock.smile_qty,
        real_qty: stock.real_qty,
        unsubmit_distribution_qty: stock.unsubmit_distribution_qty,
        unsubmit_return_qty: stock.unsubmit_return_qty,
      }
    }),
  }))
  const existsBatches = await models.Batch.findAll({
    where: {
      id: { [Op.in]: existBatchIds },
    },
    raw: true,
  })

  // mapping batch code & expired to existing batch
  new_opname_items = new_opname_items.map((item) => {
    if (item.id === null) delete item.id
    return {
      ...item,
      material_id: null,
      master_material_id: item.material_id,
      new_opname_stocks: item.new_opname_stocks.map((stock) => {
        if (stock.id === null) delete stock.id
        let existBatch = null
        if (stock.batch_id) {
          existBatch = existsBatches.find((batch) => batch.id === parseInt(stock.batch_id))
        }
        return {
          ...stock,
          batch_code: existBatch ? existBatch.code : stock.batch_code,
          expired_date: existBatch ? existBatch.expired_date : stock.expired_date,
        }
      }),
    }
  })

  const opnamePeriod = await models.OpnamePeriod.findByPk(period_id)

  let startTime = (new Date(opnamePeriod.start_date)).getTime()
  let endTime = (new Date(opnamePeriod.end_date)).getTime()
  let now = Date.now()
  if (startTime <= now && now <= endTime) {
    status = 1
  }

  const data = {
    entity_id,
    activity_id,
    period_id,
    updated_by: user.id,
    created_by: user.id,
    new_opname_items,
    status
  }
  return data
}

export async function create(req, res, next) {
  // create
  const { user, body } = req

  let dataNewopnames = req.body.data

  if (dataNewopnames.length <= 0)
    return res.status(422).json({ message: req.__('validator.not_empty', { field: 'Data opname' }) })

  const t = await sequelize.transaction()
  try {

    let newOpnameIds = []

    let opname_items_ids = []
    let opnameStockIds = []

    for (let dataNewopname of dataNewopnames) {
      const { isUpdate = 0 } = body

      const createBody = await getCreateData({ body: dataNewopname, user })

      const { entity_id, period_id, activity_id, new_opname_items } = createBody

      let newOpname = await models.NewOpname.findOne({ where: { entity_id, period_id, activity_id } })

      if (!newOpname) {
        newOpname = await models.NewOpname.create(createBody,
          {
            include: [{
              association: 'new_opname_items',
              include: { association: 'new_opname_stocks' },
            }],
          },
          { transaction: t })

      } else {

        if (!isUpdate) {
          await t.rollback()
          return res.status(422).json({ message: req.__('confirm_so'), need_confirm: 1 })
        }

        let newOpnameItems = await models.NewOpnameItem.findAll(
          {
            where: { new_opname_id: newOpname.id },
            transaction: t,
          }
        )

        let newDataOpnameItems = []

        let opnameItemIds = _.keys(_.groupBy(newOpnameItems, 'id'))

        let newOpnameStocks = await models.NewOpnameStock.findAll({ where: { new_opname_item_id: opnameItemIds }, transaction: t, })

        for (let opnameItem of new_opname_items) {
          let selectedItem = newOpnameItems.filter(it => it.master_material_id == opnameItem.master_material_id)
          opnameItem.new_opname_id = newOpname.id
          if (selectedItem.length > 0) {
            opnameItem.id = selectedItem[0].id
            opname_items_ids.push(opnameItem.id)
          }
          newDataOpnameItems.push(opnameItem)
        }

        if (newOpname?.status == createBody.status && newOpname?.updated_by == createBody.updated_by) {
          // no values have changed, so just update updated_at value
          newOpname.changed('updated_at', true)
          await newOpname.save({ transaction: t })
        } else {
          await newOpname.update({ status: createBody.status, updated_by: createBody.updated_by }, { transaction: t })
        }

        await models.NewOpnameItem.bulkCreate(newDataOpnameItems, {
          ignoreDuplicates: true,
          transaction: t,
        })


        newOpnameItems = await models.NewOpnameItem.findAll(
          {
            where: { new_opname_id: newOpname.id },
            transaction: t,
          }
        )

        let newDataOpnameStocks = []

        let conditionCheckStockId = (it, opnameStock) => {
          if (!opnameStock.stock_id && !opnameStock.batch_id)
            return it.batch_code == opnameStock.batch_code && it.new_opname_item_id == opnameStock.new_opname_item_id
          else if (!opnameStock.stock_id)
            return it.batch_code == opnameStock.batch_code && it.batch_id == opnameStock.batch_id && it.new_opname_item_id == opnameStock.new_opname_item_id
          else if (!opnameStock.batch_id)
            return it.batch_code == opnameStock.batch_code && it.stock_id == opnameStock.stock_id && it.new_opname_item_id == opnameStock.new_opname_item_id
          else if(!it.stock_id && !it.batch_id)
            return it.batch_code == opnameStock.batch_code && it.new_opname_item_id == opnameStock.new_opname_item_id
          else return it.new_opname_item_id == opnameStock.new_opname_item_id && it.stock_id == opnameStock.stock_id && it.batch_id == opnameStock.batch_id
        }

        for (let opnameItem of newDataOpnameItems) {
          let selectedItem = newOpnameItems.filter(it => it.master_material_id == opnameItem.master_material_id)
          opnameItem.new_opname_id = newOpname.id
          if (selectedItem.length > 0) {
            opnameItem.id = selectedItem[0].id
          }

          for (let opnameStock of opnameItem.new_opname_stocks) {
            if (opnameItem.id) {
              opnameStock.new_opname_item_id = opnameItem.id

              let selectedStock = newOpnameStocks.filter(it => conditionCheckStockId(it, opnameStock))
              
              if (selectedStock.length > 0) {
                opnameStock.id = selectedStock[0].id
                opnameStock.new_opname_item_id = opnameStock.new_opname_item_id ?? selectedStock[0].new_opname_item_id
                opnameStock.stock_id = opnameStock.stock_id ?? selectedStock[0].stock_id
                opnameStock.batch_id = opnameStock.batch_id ?? selectedStock[0].batch_id
                opnameStock.batch_code = opnameStock.batch_code ?? selectedStock[0].batch_code

                opnameStockIds.push(opnameStock.id)
              }
            }

            newDataOpnameStocks.push(opnameStock)
          }
        }

        await models.NewOpnameStock.bulkCreate(newDataOpnameStocks, {
          ignoreDuplicates: true,
          updateOnDuplicate: [
            'stock_id',
            'batch_id',
            'expired_date',
            'smile_qty',
            'real_qty',
            'unsubmit_distribution_qty',
            'unsubmit_return_qty',
          ],
          transaction: t,
        })

      }

      newOpnameIds.push(newOpname.id)
    }

    if (opname_items_ids.length > 0)
      await sequelize.query(`
      update new_opname_items set updated_at = NOW() where id in (:opnameItemIds)
    `, {
        type: QueryTypes.UPDATE,
        replacements: { opnameItemIds: opname_items_ids },
        transaction: t
      })

    if (opnameStockIds.length > 0)
      await sequelize.query(`
      update new_opname_stocks set updated_at = NOW() where id in (:opnameStockIds)
    `, {
        type: QueryTypes.UPDATE,
        replacements: { opnameStockIds },
        transaction: t
      })

    await t.commit()

    let data = await models.NewOpname.findAll({
      where: { id: newOpnameIds },
      include: [{
        association: 'new_opname_items',
        include: { association: 'new_opname_stocks' },
        order : [['updated_at', 'DESC']]
      }],
    })

    data = data.map((item) => {
      return {
        ...item.dataValues,
        message: !item.status ? req.__('new_opname_period') : ''
      }
    })

    return res.status(201).json(data)

  } catch (err) {
    console.error(err)
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

    const newOpnames = await models.NewOpnameStock.findAll(options)

    const workbook = await newOpnameWorkbook(newOpnames, req)

    const timestamp = Date()
    const filename = `Stock Opname (${timestamp})`

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
