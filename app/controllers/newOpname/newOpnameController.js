/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { Op } from 'sequelize'
import stream from 'stream'

import models from '../../models'
import { newOpnameWorkbook } from './newOpnameWorkbook'

const { sequelize } = models

export async function list(req, res, next) {
  try {
    // list
    const {
      entity_id, created_from, created_to,
      material_id, province_id, regency_id,
      batch_code, expired_from, expired_to,
      entity_tag_id, only_have_qty,
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
    if (material_id) newOpnameItem.where = { material_id }

    const newOpname = {}
    if (entity_id) newOpname.where = { entity_id }

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

    req.include = [{
      association: 'new_opname_item',
      ...newOpnameItem,
      required: true,
      include: [{
        association: 'new_opname',
        ...newOpname,
        required: true,
        include: [{
          association: 'entity',
          attributes: ['id', 'name'],
          ...entity,
        }, {
          association: 'user_created_by',
          attributes: ['id', 'username', 'email', 'firstname', 'lastname'],
        }],
      },
      {
        association: 'material',
        attributes: models.Material.getBasicAttribute(),
      }],
    }]
    req.condition = conditions
    req.order = [['id', 'DESC']]
    req.customOptions = { subQuery: false }
    req.mappingDocs = ({ docs }) => docs.map((stock) => {
      const {
        new_opname_item, batch_code,
        expired_date, smile_qty, real_qty,
        unsubmit_distribution_qty, unsubmit_return_qty,
      } = stock
      const { material, new_opname } = new_opname_item
      return {
        id: new_opname.id,
        entity: new_opname.entity,
        material,
        batch_code,
        expired_date,
        smile_qty,
        real_qty,
        unsubmit_distribution_qty,
        unsubmit_return_qty,
        created_at: new_opname.created_at,
        user_created_by: new_opname.user_created_by,
      }
    })

    return next()
  } catch (err) {
    return next(err)
  }
}

async function getCreateData({ body, user, isUpdate = false }) {
  let { new_opname_items, entity_id } = body
  const existBatchIds = []
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

  const data = {
    entity_id,
    updated_by: user.id,
    created_by: user.id,
    new_opname_items,
  }
  return data
}

export async function create(req, res, next) {
  const t = await sequelize.transaction()
  try {
    // create
    const { user, body } = req

    const createBody = await getCreateData({ body, user })
    const newOpname = await models.NewOpname.create(createBody,
      {
        include: [{
          association: 'new_opname_items',
          include: { association: 'new_opname_stocks' },
        }],
      },
      { transaction: t })

    await t.commit()

    return res.status(201).json({
      id: newOpname.id,
      ...newOpname.dataValues,
      opname_stock_items: newOpname.opname_stock_items,
    })
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

    const workbook = await newOpnameWorkbook(newOpnames)

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
