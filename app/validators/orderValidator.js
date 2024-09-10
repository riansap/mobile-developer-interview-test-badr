import { body, param, query } from 'express-validator'
import {
  commonNotExistsId,
  commonNotExistsField,
  commonDateMustGreaterThan,
  orderTypeNotExists,
  orderMaterialEntityNoExists,
  orderCovidMaterialEntityNoExists,
  orderOrderedQtyWrongPieces,
  orderCovidOrderedQtyWrongPieces,
  commonQueryFields,
  orderOrderedQtyWrongPiecesUpdate,
  orderUpdateInvalidStatus,
  vendorCustomerCannotBeSame,
  materialAlreadyBelongsToOrder,
  customerNotBelongsToVendor,
  orderCovidCheckStockBatches, 
  orderCovidCheckStockNonBatches,
  commonNotActiveId
} from './customValidator'

export const create = [
  body('customer_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.customer_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.customer_id')
    }))
    .custom(commonNotActiveId('Entity', 'id.customer_id'))
    .custom(customerNotBelongsToVendor()),
  body('vendor_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.vendor_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.vendor_id')
    }))
    .custom(commonNotActiveId('Entity', 'id.vendor_id'))
    .custom(vendorCustomerCannotBeSame()),
  body('type')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.type')
    }))
    .custom(orderTypeNotExists),
  body('required_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.required_date')
    }))
    .custom(commonDateMustGreaterThan('field.order.required_date', null, { isCurrentDate: true })),
  body('estimated_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.estimated_date')
    })),
  body('order_items')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.order_items')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_items')
    })),
  body('order_items.*.ordered_qty')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.ordered_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') })),
  body('order_items.*.material_id')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') }))
    .custom(commonNotActiveId('Material', 'id.material_id'))
    .custom(orderMaterialEntityNoExists)
    .custom(orderOrderedQtyWrongPieces),
  body('order_tags')
    .if(body('order_tags').exists())
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_tags')
    })),
  body('order_reason')
    .optional()
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_tags')
    }))
]

export const update = [
  param('id')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order.id')
    }))
    .custom(commonNotExistsId('Order', 'order.id'))
    .custom(orderUpdateInvalidStatus),
  body('order_items')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.order_items')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_items')
    }))
    .custom(orderOrderedQtyNotNull),
  body('required_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.required_date')
    }))
    .custom(commonDateMustGreaterThan('field.order.required_date', null, { isCurrentDate: true })),
  body('order_items.*.id')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.order_item_id')
    }))
    .custom(orderOrderedQtyWrongPiecesUpdate),
  body('order_tags')
    .optional().isArray().withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_tags')
    })),
  body('order_tags.*')
    .optional()
    .custom(commonNotExistsId('OrderTag', 'order.order_tags'))
]

export const createCovid = [
  body('customer_code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.customer_code')
    }))
    .customSanitizer((value, { req }) => {
      return value.toString()
    })
    .custom(commonNotExistsField('Entity', 'code', 'order_covid.customer_code'))
    .custom(vendorCustomerCannotBeSame({ isCovid: true }))
    .custom(customerNotBelongsToVendor({ isCovid: true })),
  body('estimated_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.estimated_date')
    })),
  body('required_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.required_date')
    }))
    .custom(commonDateMustGreaterThan('field.order.required_date', null, { isCurrentDate: true })),
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
  body('order_items.*.batches.*.code')
    .custom(orderCovidCheckStockBatches),
  body('order_items.*.batches.*.qty')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.ordered_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') })),
  body('order_items.*.material_code')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.material_code')
    }))
    .custom(orderCovidMaterialEntityNoExists)
    .custom(orderCovidOrderedQtyWrongPieces)
    .custom(orderCovidCheckStockNonBatches),
  body('order_items.*.batches.*.manufacture_name')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.manufacture_name')
    }))
    .custom(commonNotExistsField('Manufacture', 'name', 'order_covid.manufacture_name')),
  body('order_items.*.batches.*.production_date')
    .customSanitizer((value) => {
      if(!value) return null
      return value
    })
    .optional({nullable: true})
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order_covid.production_date')
    })),
  body('order_items.*.batches.*.expired_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order_covid.expired_date')
    })),
  body('order_items.*.batches')
    .custom(orderCheckDuplicateBatch),
  body('delivery_number')
    .optional({ nullable: true })
]

export const searchQuery = [
  query('purpose')
    .if(query('purpose').exists())
    .custom(commonQueryFields(['purchase', 'sales'], 'field.order.purpose'))
]

export const comment = [
  param('id')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.id')
    }))
    .custom(commonNotExistsId('Order', 'id.order_id')),
  body('comment')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('comment')
    }))
    .isString().withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('comment')
    }))
]

export const insertOrderItem = [
  param('id')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order.id')
    }))
    .custom(commonNotExistsId('Order', 'order.id'))
    .custom(orderUpdateInvalidStatus),
  body('order_items')
    .notEmpty()
    .withMessage((value, {req}) => req.__('validator.not_empty', {
      field: req.__('field.order.order_items')
    }))
    .isArray()
    .withMessage((value, {req}) => req.__('validator.array', {
      field: req.__('field.order.order_items')
    })),
  body('order_items.*.material_id')
    .notEmpty()
    .withMessage((value, {req}) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.id.material_id')
    }))
    .custom(commonNotActiveId('Material', 'id.material_id'))
    .custom(materialAlreadyBelongsToOrder)
    .custom(orderOrderedQtyWrongPieces),
  body('order_items.*.ordered_qty')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.ordered_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') }))
]

export async function orderOrderedQtyNotNull(value, { req }) {
  const { order_items } = req.body
  const total = order_items
    .map(item => parseInt(item.ordered_qty))
    .reduce((prev, curr) => prev + curr, 0)

  if(total === 0) {
    throw Error('Silahkan batalkan pesanan anda jika total jumlah kuantitas di item pesanan 0')
  }

  return true
}

export async function orderCheckDuplicateBatch(value, { req }) {
  if(value) {
    // var valueArr = value.map(function(item){ return item.code })
    var isDuplicate = value.some(function(item, idx){ 
      //console.log(item, '-', idx)
      return value.filter(it=> it.activity_id == item.activity_id && it.code == item.code).length>1
    })

    if(isDuplicate) {
      throw Error('Batch tidak boleh duplikat')
    }
  }

  return true
}

export const report = [
  body('*.material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.material_id')
    }))
    .custom(commonNotActiveId('Material', 'id.material_id')),
  body('*.arrived_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.fulfilled_at')
    }))
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.fulfilled_at')
    })),
  body('*.arrived_qty')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.arrived_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.arrived_qty') })),
  body('*.batch_code')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.batch.code')
    })),
  body('*.batch_expired')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.batch.expired_at')
    }))
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.batch.expired_at')
    }))
]