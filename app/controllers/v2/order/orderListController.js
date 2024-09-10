import moment from 'moment'
import { Op } from 'sequelize'

import models from '../../../models'

import { EXTERMINATION_ORDER_TYPE, ORDER_STATUS, ORDER_TYPE, USER_ROLE } from '../../../helpers/constants'
import { convertStringToArray } from '../../../helpers/common'
import { formatOrderXLSQuery as orderXLSQuery } from './orderXLSController'

function isNumeric(value) {
  return Number(value) == value
}


export async function list(req, res, next) {
  try {
    let {
      purpose,
      vendorId,
      customerId,
      ordered_number,
      purchase_ref,
      sales_ref,
      entity_tag_id,
      created_by,
      kode_satusehat_customer,
      kode_satusehat_vendor
    } = req.query || {}

    let {
      status,
      entityId,
      to_date,
      from_date,
      type,
      activity_id
    } = req.query

    status = convertStringToArray(status)

    const user = req.user || {}

    const { role } = user || {}

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
        include: [{
          association: 'mapping_entity',
          attributes: models.MappingEntity.getBasicAttribute()
        }]
      },
      {
        model: models.Entity,
        as: 'vendor',
        attributes: models.Entity.getBasicAttribute(),
        include: [{
          association: 'mapping_entity',
          attributes: models.MappingEntity.getBasicAttribute()
        }]
      },
      {
        association: 'activity',
        attributes: ['id', 'name'],
        paranoid: false
      },
      {
        association: 'order_items',
        attributes: ['id', 'qty', 'master_material_id', 'recommended_stock'],
        include: [
          {
            association: 'master_material',
            attributes: models.MasterMaterial.getBasicAttribute(),
            include: [
              {
                association: 'mapping_master_material',
                attributes: models.MappingMasterMaterial.getBasicAttribute(),
                //separate: true
              }
            ]
          }
        ],
        separate: true,
        where: { master_material_id: { [Op.not]: null } },
        without_relations: true
      },{
        association : 'order_items_kfa',
        separate: true
      }
    ]

    let condition = {}

    if (role == 11 && user.manufacture_id) {
      const manufacture = await models.Manufacture.findByPk(user.manufacture_id)
      if (manufacture.type == 1) {
        condition.created_by = user.id
      }
    }


    if (created_by) condition.created_by = created_by

    if (ordered_number) {
      ordered_number = ordered_number.split(',').filter(it => isNumeric(it))
      if (ordered_number.length > 0) condition.id = { [Op.in]: ordered_number }
    }
    if (purchase_ref) condition.purchase_ref = purchase_ref
    if (sales_ref) condition.sales_ref = sales_ref
    if (type) {
      type = type.split(',')
      const index = type.indexOf(String(EXTERMINATION_ORDER_TYPE.EXTERMINATION))
      if (index > -1) {
        type.splice(index, 1)
      }
      condition.type = { [Op.in]: type }
    }
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
      }
    } else if (from_date) {
      condition.created_at = { [Op.gte]: moment(from_date).toDate() }
    } else if (to_date) {
      condition.created_at = { [Op.lte]: moment(to_date).toDate() }
    }

    if (purpose === 'purchase' || purpose === 'sales') {
      if (purpose === 'purchase') {
        if (entity_tag_id) {
          include[0].include = entityTag.include
          include[0].include.where = { id: Number(entity_tag_id) }
          include[0].include.required = true
          include[0].required = true
        } else {
          condition.customer_id = req.user.entity_id
        }
        if (customerId) condition.customer_id = customerId
        if (vendorId) condition.vendor_id = { [Op.in]: vendorId.split(',') }
        else if (entityId) condition.vendor_id = entityId
      } else if (purpose === 'sales') {
        if (customerId) entityId = customerId
        if (entity_tag_id) {
          include[1].include = entityTag.include
          include[1].include.where = { id: Number(entity_tag_id) }
          include[1].include.required = true
          include[1].required = true

        } else {
          condition.vendor_id = req.user.entity_id
        }

        if (vendorId) condition.vendor_id = vendorId
        if (entityId) condition.customer_id = entityId
      }
    } else if (role === USER_ROLE.OPERATOR || role === USER_ROLE.OPERATOR_COVID) {
      if (vendorId) entityId = vendorId

      condition.customer_id = req.user.entity_id
      if (entityId) condition.vendor_id = entityId
    } else if (role === USER_ROLE.MANAGER) {
      if (customerId) entityId = customerId
      condition.vendor_id = req.user.entity_id
      if (entityId) condition.customer_id = entityId
    }

    if (kode_satusehat_vendor) {
      include[1].include[0].where = { id_satu_sehat: kode_satusehat_vendor }
      include[1].include[0].required = true
      include[1].required = true
    }

    if (kode_satusehat_customer) {
      //if(typeof(include[0].where) == 'object') include[0].where.code_satu_sehat = kode_satusehat_customer
      //else include[0].where = {code_satu_sehat : kode_satusehat_customer}

      include[0].include[0].where = { id_satu_sehat: kode_satusehat_customer }
      include[0].include[0].required = true
      include[0].required = true
    }


    req.condition = condition
    req.include = include
    req.customOptions = {
      excludeCustomerVendor: true, without_tags: true, subQuery: false, without_items: true, without_comments: true,
    }
    req.order = [['created_at', 'desc']]

    req.mappingDocs = ({ docs }) => docs.map((order) => {
      let { order_items = [], order_items_kfa = [] } = order
      // order_items = order_items.map((order_item) => mappingData({ data: order_item, req }))
      order_items = order_items.map((order_item) => {
        order_item.material_id = order_item.master_material_id
        delete order_item.master_material_id
        return order_item
      })

      delete order.dataValues.order_items_kfa
      return {
        ...order.dataValues,
        order_items,
        total_order_item : order_items_kfa.length || order_items.length,
        kfa_format : order_items_kfa.length > 0 ? true : false
      }
    })

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function listOrderHistory(req, res, next) {
  try {
    const { id: order_id } = req.params
    req.condition = {
      order_id,
    }

    next()
  } catch (err) {
    return next(err)
  }
}

export async function listStatus(req, res, next) {
  try {
    const data = []
    let {
      type, purpose, ordered_number,
      purchase_ref, sales_ref, vendorId, customerId, to_date,
      from_date, activity_id
    } = req.query
    let entityID = req.entityID
    var status = JSON.parse(JSON.stringify(ORDER_STATUS))
    let orderCondition = []
    if (type) {
      type = type.split(',')
      orderCondition.push({ type: { [Op.in]: type } })
    }

    if (purpose === 'sales') {
      orderCondition.push({ vendor_id: entityID })
    } else {
      orderCondition.push({ customer_id: entityID })
    }
    if (vendorId) orderCondition.push({ vendor_id: vendorId })
    if (customerId) orderCondition.push({ customer_id: customerId })
    if (ordered_number) {
      ordered_number = ordered_number.split(',').filter(it => isNumeric(it))
      if (ordered_number.length > 0) orderCondition.push({ id: { [Op.in]: ordered_number } })
    }
    if (purchase_ref) orderCondition.push({ purchase_ref: purchase_ref })
    if (sales_ref) orderCondition.push({ sales_ref: sales_ref })
    if (from_date) {
      orderCondition.push({
        created_at: {
          [Op.gte]: moment(from_date).toDate()
        }
      })
    } else if (to_date) {
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

    if (type && type.includes(ORDER_TYPE.DROPPING)) {
      delete status.PENDING
      delete status.CANCELED
    }

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