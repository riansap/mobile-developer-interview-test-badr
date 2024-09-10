import { body } from 'express-validator'
import {
  commonNotExistsField,
  orderCovidMaterialEntityNoExists,
  orderCovidOrderedQtyWrongPieces,
  vendorCustomerCannotBeSame,
  customerNotBelongsToVendor,
  orderCovidCheckStockNonBatches
} from './customValidator'

export const create = [
  body('customer_code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.customer_code')
    }))
    .custom(commonNotExistsField('Entity', 'code', 'order_covid.customer_code'))
    .custom(vendorCustomerCannotBeSame({ isCovid: true }))
    .custom(customerNotBelongsToVendor({ isCovid: true })),
  body('buffer_tag')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Buffer Tag'
    }))
    .isNumeric(),
  body('order_items')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.order_items')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_items')
    })),
  body('order_items.*.qty')
    .optional()
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') })),
  body('order_items.*.material_code')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.material_code')
    }))
    .custom(orderCovidMaterialEntityNoExists)
    .custom(orderCovidOrderedQtyWrongPieces)
    .custom(orderCovidCheckStockNonBatches)
]