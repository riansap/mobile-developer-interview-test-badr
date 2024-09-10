import { body, param } from 'express-validator'
import { Op } from 'sequelize'

import models from '../../../models'

import { allocateQtySameOrderQty, orderAllocateInvalid } from '../../orderStatusValidator'

import {
  commonNotExistsId,
  commonNotExistsIdByCondition,
} from '../../customValidator'

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
    .optional()
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
  body('*')
    .custom(orderAllocateLessThanStock),
  body()
    .notEmpty()
    .isArray()
    .custom(allocateQtySameOrderQty)
]

async function orderAllocateLessThanStock(value, { req }) {
  if (value && value.allocated_stock_id && value.order_item_id) {
    const { id } = req.params
    let stock = await models.Stock.findOne({
      where: { id: value.allocated_stock_id },
      include: [
        { association: 'batch' },
        { association: 'entity_master_material' }
      ]
    })
    let { entity_master_material } = stock
    let orderItemSameMaterial = await models.OrderItem.count({
      where: [
        { id: value.order_item_id }, 
        { master_material_id: entity_master_material.master_material_id }
      ],
    })
    if(!orderItemSameMaterial) throw Error('Material not same')
    let orderVendorSameEntity = await models.Order.count({
      where: [
        { id }, 
        { vendor_id: entity_master_material.entity_id }
      ],
    })
    if(!orderVendorSameEntity) throw Error('Stock not from vendor')
    

    let allocatedStock = await models.OrderStock.scope('allocated').sum('allocated_qty', {
      where: [
        { stock_id: value.allocated_stock_id },
        { order_item_id: {[Op.not]: value.order_item_id} }
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