import { body } from 'express-validator'

import models from '../../../models'

import { orderConfirmedQtyNotNull, orderStatusInvalid } from '../../orderStatusValidator'

import { ORDER_CANCEL_REASON } from '../../../helpers/constants'

import {
  commonNotExistsId,
  constantNotExist,
} from '../../customValidator'

async function orderConfirmedQtyWrongPieces(value, { req }) {
  const { material_id, confirmed_qty } = value
  const { id } = req.params
  
  if (confirmed_qty < 0) {
    throw Error('qty konfirmasi tidak boleh minus')
  }
  
  if (material_id && confirmed_qty) {
    const order = await models.Order.findByPk(id, { without_relations: true })
    const material = await models.MasterMaterial.findByPk(material_id)
    if (material) {
      const { pieces_per_unit } = material
      const mod = Number(confirmed_qty) % Number(pieces_per_unit)
      if (mod !== 0) throw Error(req.__('custom.qty_not_pieces_unit'))
    }
    const stockQty = await models.EntityMasterMaterial.findOne({
      where: [
        { master_material_id: material_id },
        { entity_id: order.vendor_id },
      ]
    })
    if (stockQty && stockQty.available_stock < confirmed_qty) {
      throw Error(
        req.__('validator.lesser_or_equal', {
          field1: `Total Allocated in Stock (${confirmed_qty})`,
          field2: `Stock Qty (${stockQty.available_stock})`,
        })
      )
    }
  }

  return true
}


const confirmNormal = [
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

const confirmKFA92 = [
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
  body('order_items.*.children.*.confirmed_qty')
    .exists()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.confirmed_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order.confirmed_qty')
    })),
  body('order_items.*.children.*')
    .custom(orderConfirmedQtyWrongPieces),
]

export const confirm = process.env.APP_SERVICE == 'logistic' ? confirmKFA92 : confirmNormal

export const pending = [
  body()
    .custom(orderStatusInvalid),
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