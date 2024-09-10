import { body, param } from 'express-validator'
import models from '../../models'
import { entityActivityDateValidator } from './entityActivityDateValidator'

export const ship = [
  // Check valid payload types
  body('activity_id').isNumeric(),
  body('vendor_code').exists({ checkFalsy: true }).custom((value, { req }) => value !== req.body.customer_code),
  body('customer_code').exists({ checkFalsy: true }),
  body('no_document').optional({ nullable: true }),
  body('type').isIn([5, '5']),
  body('order_items').notEmpty().isArray(),
  body('order_items.*.material_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.ordered_qty').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks').notEmpty().isArray(),
  body('order_items.*.stocks.*.stock_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.stock_qty').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.activity_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.stock_exterminations').notEmpty().isArray(),
  body('order_items.*.stocks.*.stock_exterminations.*.stock_extermination_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.stock_exterminations.*.discard_qty').isNumeric(),
  body('order_items.*.stocks.*.stock_exterminations.*.received_qty').isNumeric(),

  // Check integrity of qty(s)
  body('order_items').custom((value) => {
    value.forEach(orderItem => {
      const orderedQty = orderItem.ordered_qty
      const stocks = orderItem.stocks

      let totalStockQty = 0
      stocks.forEach(stock => {
        const stockQty = stock.stock_qty
        const stockExterminations = stock.stock_exterminations

        let totalStockExterminationQty = 0
        stockExterminations.forEach(stockExtermination => {
          const stockExterminationQty = stockExtermination.discard_qty + stockExtermination.received_qty
          totalStockExterminationQty += stockExterminationQty
        })

        if (stockQty !== totalStockExterminationQty) throw new Error(`Integrity error: stock_qty(${stockQty}) not equal sum of stock_exterminations qty(${totalStockExterminationQty})`)

        totalStockQty += stockQty
      })

      if (orderedQty !== totalStockQty) {
        throw new Error(`Integrity error: ordered_qty(${orderedQty}) not equal sum of stocks qty(${totalStockQty})`)
      }
    })

    return value
  }),

  body()
    .custom(async (value, { req }) => {
      const { vendor_code, activity_id } = req.body

      const entity = await models.Entity.findOne({
        where: { code: vendor_code }
      })

      return entityActivityDateValidator(entity.id, activity_id, req)
    })
]

export const independent = [
  // Check valid payload types
  body('activity_id').isNumeric(),
  // body('flow_id').isNumeric(),
  body('customer_code').exists({ checkFalsy: true }),
  body('no_document').optional({ nullable: true }),
  body('order_items').notEmpty().isArray(),
  body('order_items.*.material_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.ordered_qty').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks').notEmpty().isArray(),
  body('order_items.*.stocks.*.stock_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.stock_qty').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.activity_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.stock_exterminations').notEmpty().isArray(),
  body('order_items.*.stocks.*.stock_exterminations.*.stock_extermination_id').isNumeric().bail().exists({ checkFalsy: true }),
  body('order_items.*.stocks.*.stock_exterminations.*.discard_qty').isNumeric(),
  body('order_items.*.stocks.*.stock_exterminations.*.received_qty').isNumeric(),

  // Check integrity of qty(s)
  body('order_items').custom((value) => {
    value.forEach(orderItem => {
      const orderedQty = orderItem.ordered_qty
      const stocks = orderItem.stocks

      let totalStockQty = 0
      stocks.forEach(stock => {
        const stockQty = stock.stock_qty
        const stockExterminations = stock.stock_exterminations

        let totalStockExterminationQty = 0
        stockExterminations.forEach(stockExtermination => {
          const stockExterminationQty = stockExtermination.discard_qty + stockExtermination.received_qty
          totalStockExterminationQty += stockExterminationQty
        })

        if (stockQty !== totalStockExterminationQty) throw new Error(`Integrity error: stock_qty(${stockQty}) not equal sum of stock_exterminations qty(${totalStockExterminationQty})`)

        totalStockQty += stockQty
      })

      if (orderedQty !== totalStockQty) {
        throw new Error(`Integrity error: ordered_qty(${orderedQty}) not equal sum of stocks qty(${totalStockQty})`)
      }
    })

    return value
  }),

  body()
    .custom(async (value, { req }) => {
      const { customer_code, activity_id } = req.body

      const entity = await models.Entity.findOne({
        where: { code: customer_code }
      })

      return entityActivityDateValidator(entity.id, activity_id, req)
    })
]

export const fulfill = [
  param('id')
    .custom(async (value, { req }) => {
      const order = await models.Order.findOne({
        where: { id: value }
      })

      return entityActivityDateValidator(order.customer_id, order.activity_id, req)
    })
]