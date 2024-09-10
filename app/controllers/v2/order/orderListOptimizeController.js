import moment from 'moment'
import {Op} from 'sequelize'

import models from '../../../models'

import {EXTERMINATION_ORDER_TYPE, USER_ROLE} from '../../../helpers/constants'
import {convertStringToArray} from '../../../helpers/common'
import {formatOrderXLSQuery as orderXLSQuery} from './orderXLSOptimizeController'
import listResponse from '../../../helpers/listResponse'
import { getOrderItems, getOrdersData } from './orderNormalController'

function isNumeric(value){
  return Number(value) == value
}

export async function filter(req, res, next) {
  try {
    let {
      purpose,
      vendorId,
      customerId,
      ordered_number,
      purchase_ref,
      sales_ref,
      entity_tag_id,
    } = req.query || {}

    let {
      status,
      entityId,
      to_date,
      from_date,
      type,
      activity_id,
      page,
      paginate
    } = req.query

    status = convertStringToArray(status)

    const {role} = req.user || {}

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
      },
      {
        model: models.Entity,
        as: 'vendor',
        attributes: models.Entity.getBasicAttribute(),
      },
      {
        association: 'activity',
        attributes: ['id', 'name'],
        paranoid : false
      },
      {
        model: models.OrderItem,
        as: 'order_items',
        attributes: ['id', 'qty', 'master_material_id', 'recommended_stock'],
        separate: true,
        where: {master_material_id: {[Op.not]: null}}
      },
    ]

    let condition = {}

    if (ordered_number){
      ordered_number = ordered_number.split(',').filter(it=> isNumeric(it))
      if(ordered_number.length>0) condition.id = ordered_number
    }
    if (purchase_ref) condition.purchase_ref = purchase_ref
    if (sales_ref) condition.sales_ref = sales_ref
    if (type) {
      type = type.split(',')
      const index = type.indexOf(String(EXTERMINATION_ORDER_TYPE.EXTERMINATION))
      if (index > -1) {
        type.splice(index, 1)
      }
      condition.type = type
    }
    if (status.length > 0) {
      status = status.map(item => parseInt(item))
      condition.status = status
    }
    if (activity_id) {
      condition.activity_id = activity_id
    } else {
      condition.activity_id = {[Op.not]: null}
    }

    if (from_date) {
      condition.from_date = moment(from_date).toDate()
    } 
    
    if (to_date) {
      condition.to_date = moment(to_date).toDate()
    }

    if (purpose === 'purchase' || purpose === 'sales') {
      if (purpose === 'purchase') {
        if (entity_tag_id) {
          include[0].include = entityTag.include
          include[0].include.where = {id: Number(entity_tag_id)}
          include[0].include.required = true
          include[0].required = true
        } else {
          condition.customer_id = req.user.entity_id
        }
        if (customerId) condition.customer_id = customerId
        if (vendorId) condition.vendor_id = vendorId.split(',')
        else if (entityId) condition.vendor_id = entityId
      } else if (purpose === 'sales') {
        if (customerId) entityId = customerId
        if (entity_tag_id) {
          include[1].include = entityTag.include
          include[1].include.where = {id: Number(entity_tag_id)}
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

    condition.page = page
    condition.paginate = paginate

    req.condition = condition
    req.include = include
    req.customOptions = {
      excludeCustomerVendor: true, subQuery: false, without_items: true, without_comments: true,
    }
    req.order = [['created_at', 'desc']]

    req.queryParam = condition

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function customList(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query
    let checkParam = 0
    for (var key in req.query) {
      if (key !== 'page' && key !== 'paginate' && key !== 'size' && key !== 'lang') {
        if (req.query[key] !== '') {
          checkParam++
        }
      }
    }
    if (checkParam === 0) {
      throw { status: 204, message: req.__('204') }
    }
    const {
      queryParam = {}
    } = req

    let docs = []
    let total = 10

    docs = await getOrdersData(queryParam)
    const orderId = docs.map((order) => order.id)
    const orderItems = await getOrderItems(orderId)
    const count = await getOrdersData(queryParam, true)
    total = count[0].total

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    docs = docs.map(data => {
      const order_items = orderItems.filter((orderItem) => orderItem.order_id === data.id).map((orderItem) => {
        return {
          id: orderItem.id,
          qty: orderItem.qty,
          master_material_id: orderItem.master_material_id,
          recommended_stock: orderItem.recommended_stock,
          material_id: orderItem.material_id
        }
      })
      data.order_items = order_items

      return data
    })

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

export const formatOrderXLSQuery = orderXLSQuery