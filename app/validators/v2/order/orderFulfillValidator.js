import { body, param } from 'express-validator'
import { Op } from 'sequelize'

import models from '../../../models'

import { orderStatusInvalid, orderFullfillDateInvalid } from '../../orderStatusValidator'
import { ORDER_TYPE } from '../../../helpers/constants'
import { entityActivityDateValidator } from '../entityActivityDateValidator'

const fulfilledNormal = [
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
  body('order_items.*.order_stock_fulfill')
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_stock')
    })),
  body('order_items.*.order_stock_fulfill.*.order_stock_ids')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_stock.id')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order_stock.id')
    })),
  body('order_items.*.order_stock_fulfill.*.received_qty')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_stock.received_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.received_qty')
    })),
  body('order_items.*.order_stock_fulfill.*.batch_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.batch_id')
    })),
  body('order_items.*.order_stock_fulfill.*')
    .custom(orderStockIDNotExists)
    .custom(orderReceivedQtyInvalid),
  body()
    .custom(orderStatusInvalid),
  param('id')
    .custom(checkActivityDateBasedOnOrder)
]


const fulfilledKFA92 = [
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
  body('order_items.*.children')
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_items')
    })),
  body('order_items.*.children.*.order_stock_fulfill')
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_stock')
    })),
  body('order_items.*.children.*.order_stock_fulfill.*.order_stock_ids')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_stock.id')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order_stock.id')
    })),
  body('order_items.*.chidren.*.order_stock_fulfill.*.received_qty')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_stock.received_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.received_qty')
    })),
  body('order_items.*.children.*.order_stock_fulfill.*.batch_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order_stock.batch_id')
    })),
  body('order_items.*.children.*.order_stock_fulfill.*')
    .custom(orderStockIDNotExists)
    .custom(orderReceivedQtyInvalid),
  body()
    .custom(orderStatusInvalid),
  param('id')
    .custom(checkActivityDateBasedOnOrder)
]


export const fulfilled = process.env.APP_SERVICE == 'logistic' ? fulfilledKFA92 : fulfilledNormal

async function orderStockIDNotExists(value, { req }) {
  if (value) {
    const { id: orderID } = req.params
    const { order_stock_ids, batch_id = null } = value
    if (batch_id === undefined) throw Error('Batch ID must exists')
    // 
    const hasOrderStockID = await models.OrderStock.count({
      where: { id: { [Op.in]: order_stock_ids } },
      required: true,
      include: [{
        association: 'stock',
        where: { batch_id },
        required: true,
        attributes: ['id', 'batch_id']
      }, {
        association: 'order_item',
        attributes: ['order_id', 'id'],
        where: { order_id: orderID },
      }],
    })
    if (!hasOrderStockID && hasOrderStockID !== value.length) {
      throw Error(
        req.__('validator.not_exist', {
          field: `${req.__('field.order_stock.id')} or ${req.__('field.id.batch_id')}`,
        })
      )
    }
  }
  return true
}

async function orderReceivedQtyInvalid(value, { req }) {
  if (value) {
    const { order_stock_ids, received_qty } = value
    const sumAllocatedQty = await models.OrderStock.sum('allocated_qty', {
      where: {
        id: { [Op.in]: order_stock_ids }
      }
    })
    if (parseInt(received_qty) !== sumAllocatedQty) {
      throw Error('Kuantitas yang diterima harus sama dengan yang dikirim')
    }
  }
  return true
}

async function checkActivityDateBasedOnOrder(value, { req }) {
  const order = await models.Order.findOne({
    where: { id: value }
  })

  let entityId = null
  switch (order.type) {
    case ORDER_TYPE.NORMAL:
      entityId = order.customer_id
      break
    case ORDER_TYPE.DROPPING:
      entityId = order.customer_id
      break
    case ORDER_TYPE.RETURN:
      entityId = order.vendor_id
      break
    default:
      break
  }

  return entityActivityDateValidator(entityId, order.activity_id, req)
}