import { body, param } from 'express-validator'
import { ORDER_CANCEL_REASON, ORDER_TYPE, USER_ROLE } from '../helpers/constants'
import { ORDER_STATUS } from '../helpers/constants'
import models from '../models'
import { Op } from 'sequelize'
import moment from 'moment'

import {
  commonNotExistsId,
  commonDateMustGreaterThan,
  commonNotExistsIdByCondition,
  constantNotExist
} from './customValidator'

export const confirm = [
  body()
    .custom(orderStatusInvalid)
    .custom(orderConfirmedQtyNotNull),
  body('order_items.*.order_id')
    .exists()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.order_item_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.order_item_id')
    }))
    .custom(commonNotExistsId('Order', 'order.id')),
  body('order_items.*.confirmed_qty')
    .exists()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.confirmed_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order.confirmed_qty')
    })),
  body('order_items.*')
    .custom(orderConfirmedQtyWrongPieces),
]

export const pending = [
  body()
    .custom(orderStatusInvalid),
]

export const allocate = [
  param('id')
    .isNumeric().withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order.id')
    }))
    .custom(commonNotExistsId('Order', 'order.id'))
    .custom(orderAllocateInvalid),
  body()
    .notEmpty()
    .isArray()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'body'
    })),
  body('*.status')
    .optional({ nullable: true })
    .isNumeric(),
  body('*.id')
    .optional()
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.id')
    })),
  body('*.order_item_id')
    .exists()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.order_item_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.order_item_id')
    }))
    .custom(commonNotExistsIdByCondition('OrderItem', 'id.order_item_id', { order_id: param('id') })),
  body('*.allocated_stock_id')
    .exists()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.allocated_stock_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.allocated_stock_id')
    }))
    .custom(commonNotExistsId('Stock', 'id.allocated_stock_id')),
  body('*.allocated_qty')
    .exists()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_stock.allocated_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.allocated_qty')
    })),
  body('*').custom(orderAllocateLessThanStock),
  body().notEmpty().isArray().custom(allocateQtySameOrderQty)
]

export const ship = [
  body('estimated_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.estimated_date')
    }))
    .custom(commonDateMustGreaterThan('field.order.estimated_date', null, { isCurrentDate: true })),
  body('track_device')
    .optional({ nullable: true })
    .custom(trackDeviceValid),
  body()
    .custom(orderStatusInvalid)
]

export const cancel = [
  body('cancel_reason')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order.cancel_reason')
    }))
    .custom(constantNotExist(ORDER_CANCEL_REASON, 'field.order.cancel_reason')),
  body()
    .custom(orderStatusInvalid)
]

export const fulfilled = [
  body('fulfilled_at')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.fulfilled_at')
    }))
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.fulfilled_at')
    }))
    .custom(orderFullfillDateInvalid),
  body('order_items')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.order_items')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_items')
    })),
  // body('order_items.*.order_stocks')
  //   .notEmpty()
  //   .withMessage((value, {req}) => req.__('validator.not_empty', {
  //     field: req.__('field.order.order_stock')
  //   }))
  //   .isArray()
  //   .withMessage((value, {req}) => req.__('validator.array', {
  //     field: req.__('field.order.order_stock')
  //   })),
  body('order_items.*.order_stocks.*.id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_stock.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.id')
    }))
    .custom(commonNotExistsId('OrderStock', 'order_stock.id'))
    .custom(orderStockNotExists),
  body('order_items.*.order_stocks.*.received_qty')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_stock.received_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.received_qty')
    })),
  body('order_items.*.order_stocks.*')
    .custom(orderReceivedQtyInvalid),
  body()
    .custom(orderStatusInvalid)
]

export async function orderAllocateInvalid(value, { req }) {
  if (value) {
    const order = await models.Order.findByPk(value)
    if (!order) {
      throw Error(req.__('404'))
    }
    const { status } = order
    if (status != ORDER_STATUS.CONFIRMED) throw Error(req.__('custom.allocate_stock_not_confirmed'))
  }
  return true
}

async function orderAllocateLessThanStock(value, { req }) {
  if (value && value.allocated_stock_id && value.order_item_id) {
    // let stock = await models.Stock.sum('qty', {
    //   where: { id: value.allocated_stock_id }
    // }).then(sum => { return sum })
    const { id } = req.params
    let stock = await models.Stock.findOne({
      where: { id: value.allocated_stock_id },
      include: [
        { association: 'batch' },
        { association: 'material_entity' }
      ]
    })
    let order = await models.Order.findOne({
      where: { id: id },
      without_relations: true
    })
    let orderItem = await models.OrderItem.findOne({
      where: { id: value.order_item_id },
      without_relations: true
    })
    if (stock.material_entity.entity_id !== order.vendor_id) {
      throw Error('Stock not from vendor')
    }
    if (stock.material_entity.material_id !== orderItem.material_id) {
      throw Error('Material not same')
    }
    if (stock.batch) {
      // disable batch expired
      // if(models.Batch.isExpired(stock.batch.expired_date)) {
      //   throw Error(req.__('custom.batch_expired', { batch: stock.batch.code }))
      // }
    }

    let allocatedStock = await models.OrderStock.scope('allocated').sum('allocated_qty', {
      where: [
        { stock_id: value.allocated_stock_id },
        { order_item_id: { [Op.not]: value.order_item_id } }
      ]
    }).then(sum => { return sum + value.allocated_qty })

    let messageStock = stock.batch ? ` on Stock ${stock.batch.code}` : ''
    if (stock.qty < allocatedStock) throw Error(
      req.__('validator.lesser_or_equal', {
        field1: `Total Allocated in Stock (${allocatedStock})`,
        field2: `Stock Qty (${stock.qty})${messageStock}`
      })
    )
  }
  return true
}

export async function orderStatusInvalid(value, { req }) {
  if (value) {
    const { id } = req.params
    const order = await models.Order.findByPk(id)
    if (!order) throw Error(req.__('404'))
    const updateStatus = value.status
    const currentStatus = order.status
    if (currentStatus === updateStatus) throw Error(req.__('custom.order_status_exist'))
    if (currentStatus === ORDER_STATUS.FULFILLED) throw Error(req.__('custom.order_status_fulfilled'))
    if (currentStatus === ORDER_STATUS.CANCELED) throw Error(req.__('custom.order_status_cancelled'))
    if (currentStatus > updateStatus) {
      if (currentStatus < ORDER_STATUS.SHIPPED && updateStatus === ORDER_STATUS.PENDING) {
        // skip
      } else {
        throw Error(req.__('custom.order_status_back'))
      }
    }

    const isUserSuperadmin = req.user.role === USER_ROLE.SUPERADMIN
    switch (updateStatus) {
      case ORDER_STATUS.FULFILLED:
        if (!isUserSuperadmin && order.customer_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
        if (currentStatus !== ORDER_STATUS.SHIPPED) throw Error(req.__('custom.order_status_unshipped'))
        break
      case ORDER_STATUS.CANCELED:
        if (!isUserSuperadmin && req.user.role !== USER_ROLE.ADMIN) {
          if (currentStatus === ORDER_STATUS.PENDING) {
            if (order.vendor_id !== req.entityID && order.customer_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
          } else if (currentStatus === ORDER_STATUS.SHIPPED) {
            if (order.type === ORDER_TYPE.DROPPING) {
              throw Error(req.__('custom.order_status_unauthorized'))
            } else {
              if (order.vendor_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
            }
          } else {
            if (order.vendor_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
          }
        }
        break
      default:
        if (!isUserSuperadmin && order.vendor_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
        break
    }
    // if (updateStatus === ORDER_STATUS.FULFILLED) {
    //   if (order.customer_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
    //   if(currentStatus !== ORDER_STATUS.SHIPPED) throw Error(req.__('custom.order_status_unshipped'))
    // } else {
    //   if(updateStatus === ORDER_STATUS.CANCELED && currentStatus === ORDER_STATUS.PENDING) {
    //     if(req.user.role !== USER_ROLE.SUPERADMIN || req.user.role !== USER_ROLE.ADMIN) {
    //       if(order.vendor_id !== req.entityID && order.customer_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
    //     }
    //   } else {
    //     if (order.vendor_id !== req.entityID) throw Error(req.__('custom.order_status_unauthorized'))
    //   }
    // }
  }
  return true
}

export async function allocateQtySameOrderQty(value, { req }) {
  if (value && Array.isArray(value)) {
    const { id } = req.params
    let allocatedItems = []
    let idx = null
    let totalAllocated = 0
    await Promise.all(
      value.map(async input => {
        if (input.order_item_id) {
          idx = allocatedItems.findIndex(item => item.id === input.order_item_id)
          totalAllocated += parseInt(input.allocated_qty)
          if (idx === -1) {
            allocatedItems.push({
              id: parseInt(input.order_item_id),
              total_qty: parseInt(input.allocated_qty)
            })
          } else {
            allocatedItems[idx].total_qty += parseInt(input.allocated_qty)
          }
        } else if (input.order_item_kfa_id) {
          totalAllocated += parseInt(input.allocated_qty)
        }
      })
    )

    //if (totalAllocated <= 0 && allocatedItems.length > 0) throw Error(req.__('custom.order_allocated_qty_0'))

    let isDropping = await models.Order.count({ where: [{ id: id, type: ORDER_TYPE.DROPPING }] })
    if (isDropping) {
      return true
    }
    for (let q = 0; q < allocatedItems.length; q++) {
      let order = await models.OrderItem.findOne({
        where: [{ order_id: id }, { id: allocatedItems[q].id }]
      })
      if (!order) throw Error(req.__('404'))
      if (order.confirmed_qty !== allocatedItems[q].total_qty) throw Error(
        req.__('validator.same_value', {
          field1: req.__('field.order.allocated_qty') + ` (${allocatedItems[q].total_qty})`,
          field2: req.__('field.order.confirmed_qty') + ` (${order.confirmed_qty})`
        })
      )
    }
  }
  return true
}

export async function orderFullfillDateInvalid(value, { req }) {
  if (value) {
    const { id } = req.params
    const order = await models.Order.findByPk(id)
    if (!order) throw Error(req.__('404'))

    let shippedDate = order.actual_shipment ?? order.shipped_at
    const startDate = moment(shippedDate).format('YYYY-MM-DD')
    const endDate = moment().format('YYYY-MM-DD')
    if (value !== endDate && value !== startDate && !moment(value).isBetween(startDate, endDate)) {
      throw Error(
        req.__('validator.between', {
          field: req.__('field.order.fulfilled_at'),
          condition: `(${startDate} - ${endDate})`
        })
      )
    }
  }
  return true
}

async function orderReceivedQtyInvalid(value, { req }) {
  if (value) {
    const { id, received_qty } = value
    const orderStock = await models.OrderStock.findByPk(id)
    if (!orderStock) throw Error(req.__('404'))
    if (parseInt(received_qty) !== orderStock.allocated_qty) {
      throw Error('Kuantitas yang diterima harus sama dengan yang dikirim')
    }
  }
  return true
}

async function orderStockNotExists(value, { req }) {
  if (value) {
    const { id } = req.params
    const order = await models.Order.count({
      where: { id: id },
      include: [{
        association: 'order_items',
        attributes: ['order_id', 'id'],
        include: [{
          association: 'order_stocks',
          where: { id: value },
          attributes: ['id', 'order_item_id'],
          required: true
        }],
        without_relations: true
      }]
    }).then(result => {
      return result
    })
    if (!order) {
      throw Error(
        req.__('validator.not_exists', {
          field: req.__('field.order_stock.id'),
        })
      )
    }
  }
  return true
}

async function trackDeviceValid(value, { req }) {
  if (value) {
    const { id } = req.params
    const order = await models.Order.findByPk(id)
    if (!order) throw Error(req.__('404'))
    const trackDevice = await models.TrackDevice.findOne({
      where: { id: value.id, nopol: value.nopol }
    })
    if (!trackDevice) throw Error(req.__('404'))
    if (!order.customer.lat && !order.customer.lng) {
      throw Error(req.__('custom.location_incomplete', { model: req.__('field.id.customer_id') }))
    }
    if (!order.vendor.lat && !order.vendor.lng) {
      throw Error(req.__('custom.location_incomplete', { model: req.__('field.id.vendor_id') }))
    }
  }
  return true
}

async function orderConfirmedQtyWrongPieces(value, { req }) {
  const { material_id, confirmed_qty } = value
  const { id } = req.params
  const order = await models.Order.findByPk(id, { without_relations: true })
  if (confirmed_qty < 0) {
    throw Error('qty konfirmasi tidak boleh minus')
  }

  if (material_id && confirmed_qty) {
    const material = await models.Material.findByPk(material_id)
    if (material) {
      const { pieces_per_unit } = material
      const mod = Number(confirmed_qty) % Number(pieces_per_unit)
      if (mod !== 0) throw Error(req.__('custom.qty_not_pieces_unit'))
    }
    const stockQty = await models.Stock.count('qty', {
      include: {
        association: 'material_entity',
        where: [
          { material_id },
          { entity_id: order.vendor_id },
        ],
      },
    })
    if (stockQty < confirmed_qty) {
      throw Error(
        req.__('validator.lesser_or_equal', {
          field1: `Total Allocated in Stock (${confirmed_qty})`,
          field2: `Stock Qty (${stockQty})`,
        })
      )
    }
  }

  return true
}

export async function orderConfirmedQtyNotNull(value, { req }) {
  const { order_items } = value
  const total = order_items
    .map(item => parseInt(item.confirmed_qty))
    .reduce((prev, curr) => prev + curr, 0)

  if (total === 0) {
    throw Error(req.__('custom.order_confirm_qty_0'))
  }

  return true
}
