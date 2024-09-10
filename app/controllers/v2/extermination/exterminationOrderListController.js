import moment from 'moment'
import { Op } from 'sequelize'
import stream from 'stream'

import models from '../../../models'

import { ENTITY_TYPE, EXTERMINATION_ORDER_TYPE, ORDER_STATUS, USER_ROLE } from '../../../helpers/constants'
import { convertStringToArray } from '../../../helpers/common'
import { exterminationWorkbook } from '../../../helpers/xls/exterminationWorkbook'
import { async } from 'regenerator-runtime'

import { formatOrderXLSQuery as orderXLSQuery } from './exterminationXLSController'

export async function list(req, res, next) {
  try {
    const lang = req.headers['accept-language'] || 'id'
    const {
      purpose,
      vendor_id,
      customer_id,
      ordered_number,
      entity_tag_id,
    } = req.query || {}

    let {
      status,
      to_date,
      from_date,
      entity_id,
      activity_id
    } = req.query

    status = convertStringToArray(status)

    const { role } = req.user || {}

    let entityTag = {}
    if (entity_tag_id) {
      entityTag = {
        include: {
          association: 'entity_tags',
          attributes: ['id'],
        },
      }
    }

    const include = [
      {
        model: models.Entity,
        as: 'customer',
        attributes: models.Entity.getBasicAttribute(),
        ...entityTag,
      },
      {
        model: models.Entity,
        as: 'vendor',
        attributes: models.Entity.getBasicAttribute(),
        ...entityTag,
      },
      {
        association: 'activity',
        attributes: ['id', 'name'],
      },
      {
        model: models.OrderItem,
        as: 'order_items',
        attributes: ['id', 'qty', 'master_material_id', 'recommended_stock'],
        separate: true,
        where: { master_material_id: { [Op.not]: null } }
      },
    ]

    const condition = {}

    if (ordered_number) condition.id = ordered_number
    if (status.length > 0) {
      status = status.map(item => parseInt(item))
      condition.status = { [Op.in]: status }
    }
    if (activity_id) {
      condition.activity_id = activity_id
    } else {
      condition.activity_id = { [Op.not]: null }
    }

    if (from_date && to_date) {
      const diff = moment(to_date).diff(moment(from_date), 'seconds')
      if (diff >= 0) {
        if (diff === 0) to_date = moment(from_date).add(23, 'hour')
        condition.created_at = {
          [Op.between]: [moment(from_date).toDate(), moment(to_date).toDate()],
        }
      } else {
        throw { status: 400, message: 'Invalid date range' }
      }
    } else if (from_date) {
      condition.created_at = { [Op.gte]: moment(from_date).toDate() }
    } else if (to_date) {
      condition.created_at = { [Op.lte]: moment(to_date).toDate() }
    }

    if (purpose === 'purchase' || purpose === 'sales') {
      if (purpose === 'purchase') {
        if (entity_tag_id) {
          include[0].include.where = { id: Number(entity_tag_id) }
          include[0].include.required = true
          include[0].required = true
        } else {
          condition.customer_id = req.user.entity_id
        }
        if (customer_id) condition.customer_id = customer_id
        if (vendor_id) condition.vendor_id = { [Op.in]: vendor_id.split(',') }
        else if (entity_id) condition.vendor_id = entity_id
      } else if (purpose === 'sales') {
        if (customer_id) entity_id = customer_id
        if (entity_tag_id) {
          include[1].include.where = { id: Number(entity_tag_id) }
          include[1].include.required = true
          include[1].required = true
        } else {
          condition.vendor_id = req.user.entity_id
        }

        if (vendor_id) condition.vendor_id = vendor_id
        if (entity_id) condition.customer_id = entity_id
      }
    } else if (role === USER_ROLE.OPERATOR || role === USER_ROLE.OPERATOR_COVID || role === USER_ROLE.MANAGER) {
      if (customer_id) entity_id = customer_id
      condition[Op.or] = { customer_id: req.user.entity_id, vendor_id: req.user.entity_id }
      if (entity_id) condition.customer_id = entity_id
    }
    if (entity_id) condition.vendor_id = entity_id
    if (vendor_id) condition.vendor_id = vendor_id


    condition.type = EXTERMINATION_ORDER_TYPE.EXTERMINATION

    console.log(condition)

    req.condition = condition
    req.include = include
    req.customOptions = {
      excludeCustomerVendor: true, subQuery: false, without_items: true, without_comments: true,
    }
    req.order = [['created_at', 'desc']]

    req.mappingDocs = ({ docs }) => docs.map((order) => {
      let { order_items = [] } = order
      // order_items = order_items.map((order_item) => mappingData({ data: order_item, req }))
      order_items = order_items.map((order_item) => {
        order_item.material_id = order_item.master_material_id
        delete order_item.master_material_id

        order_item.order_stocks?.map(orderStock => {
          orderStock.order_stock_exterminations?.map(orderStockExtermination => {
            orderStockExtermination.stock_extermination?.map(stockExtermination => {
              let title = stockExtermination.transaction_reason.title?.trim()

              stockExtermination.transaction_reason.title = lang == 'en' ? req.__(`field.transaction_reason.list.${title}`) : title

              return stockExtermination
            })
          })
        })
        return order_item
      })
      return {
        ...order.dataValues,
        order_items,
      }
    })

    return next()
  } catch (err) {
    console.log('err', err)

    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    const order = await detailData(req)
    if (!order) throw { status: 403, message: req.__('403') }

    return res.status(200).json(order)
  } catch (err) {
    return next(err)
  }
}

export async function detailDownload(req, res, next) {
  try {
    let orderData = await detailData(req)
    let regencyName = ''
    if (orderData.vendor.regency_id) {
      const regency = await models.Regency.findByPk(orderData.vendor.regency_id)
      regencyName = regency.name
    }

    let provinceName = ''
    if (orderData.vendor.province_id) {
      const province = await models.Province.findByPk(orderData.vendor.province_id)
      provinceName = province.name
    }

    const workbook = await exterminationWorkbook(orderData, provinceName, regencyName, req)
    const timestamp = Date()
    const filename = `${req.__('report_header.bapp.filename')} ${orderData.vendor.name} ${timestamp}`

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
  } catch (err) {
    return next(err)
  }
}

async function detailData(req) {
  const { id } = req.params

  const condition = {}
  if (!(req.user.role === USER_ROLE.SUPERADMIN || req.user.role === USER_ROLE.ADMIN)) {
    if (req.user.entity.type === ENTITY_TYPE.PROVINSI) {
      let temp = []
      const entities = await models.Entity.findAll({
        where: {
          province_id: req.user.entity.province_id
        },
        attributes: ['id']
      })
      entities.forEach(item => { temp.push(item.id) })
      condition[Op.or] = { vendor_id: temp, customer_id: temp }
    } else {
      condition[Op.or] = { vendor_id: req.user.entity_id, customer_id: req.user.entity_id }
    }
  }

  let userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
  let order = await models.Order.findOne({
    where: [{
      id,
      activity_id: { [Op.not]: null },
      ...condition,
    }],
    include: [
      {
        association: 'activity',
        attributes: ['id', 'name'],
        required: false,
      },
      {
        association: 'order_items',
        attributes: models.OrderItem.getBasicAttribute(),
        required: true,
        include: [
          {
            association: 'master_material',
            attributes: models.MasterMaterial.getBasicAttribute(),
          },
          {
            association: 'order_stocks',
            attributes: models.OrderStock.getBasicAttribute(),
            include: [
              {
                association: 'stock',
                attributes: models.Stock.getBasicAttribute(),
                include: [
                  {
                    association: 'batch',
                    attributes: models.Batch.getBasicAttribute(),
                    include: {
                      association: 'manufacture',
                      attributes: ['name']
                    }
                  },
                  {
                    association: 'activity',
                    attributes: models.MasterActivity.getBasicAttribute(),
                  }
                ]
              },
              {
                association: 'order_stock_exterminations',
                attributes: models.OrderStockExtermination.getBasicAttribute(),
                include: {
                  association: 'stock_extermination',
                  attributes: models.StockExtermination.getBasicAttributes(),
                  include: {
                    association: 'transaction_reason',
                    attributes: ['title']
                  },
                },
              }
            ]
          },
          {
            association: 'user_created_by',
            attributes: userAttributes
          },
          {
            association: 'user_updated_by',
            attributes: userAttributes
          },
        ]
      },
    ],
    without_items: true
  })
  if (!order) throw { status: 403, message: req.__('403') }

  return order
}


export async function listStatus(req, res, next) {
  try {
    const data = []
    let {
      purpose,
      ordered_number,
      purchase_ref, sales_ref, vendor_id, customer_id, to_date,
      from_date, activity_id
    } = req.query
    let entityID = req.entityID
    var status = JSON.parse(JSON.stringify(ORDER_STATUS))
    delete status.PENDING
    delete status.CONFIRMED
    delete status.ALLOCATED

    let orderCondition = []

    orderCondition.push({ type: 5 })

    if (purpose === 'sales') {
      orderCondition.push({ vendor_id: entityID })
    } else {
      orderCondition.push({ customer_id: entityID })
    }
    if (vendor_id) orderCondition.push({ vendor_id: vendor_id })
    if (customer_id) orderCondition.push({ customer_id: customer_id })
    if (ordered_number) orderCondition.push({ id: ordered_number })
    if (purchase_ref) orderCondition.push({ purchase_ref: purchase_ref })
    if (sales_ref) orderCondition.push({ sales_ref: sales_ref })

    if (from_date && to_date) {
      const diff = moment(to_date).diff(moment(from_date), 'seconds')
      if (diff >= 0) {
        if (diff === 0) to_date = moment(from_date).add(23, 'hour')
        orderCondition.push({
          created_at: {
            [Op.between]: [moment(from_date).toDate(), moment(to_date).toDate()],
          }
        })
      } else {
        throw { status: 400, message: 'Invalid date range' }
      }
    } else if (from_date) {
      orderCondition.push({
        created_at: {
          [Op.gte]: moment(from_date).toDate()
        }
      })
    }
    else if (to_date) {
      orderCondition.push({
        created_at: {
          [Op.lte]: moment(to_date).toDate()
        }
      })
    }
    if (activity_id) {
      if (typeof activity_id === 'array') {
        orderCondition.push({
          activity_id: { [Op.in]: activity_id }
        })
      } else {
        orderCondition.push({
          activity_id
        })
      }
    } else {
      orderCondition.push({
        activity_id: { [Op.not]: null }
      })
    }

    console.log(orderCondition)

    let orderAll = await models.Order.count({
      where: orderCondition,
      attributes: ['id', 'status', 'customer_id'],
      without_relations: true,
    })

    data.push({
      id: null,
      title: 'ALL',
      total: orderAll || 0
    })

    for (let item of Object.keys(status)) {
      let orderPerStatus = await models.Order.count({
        where: [
          ...orderCondition,
          { status: status[item] }
        ],
        attributes: ['id', 'status', 'customer_id'],
        without_relations: true,
      })
      data.push({
        id: status[item],
        title: item,
        total: orderPerStatus || 0
      })
    }

    return res.status(200).json({ list: data })
  } catch (err) {
    return next(err)
  }
}

export const formatOrderXLSQuery = orderXLSQuery