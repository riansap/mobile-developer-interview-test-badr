import { body, param } from 'express-validator'
import models from '../../../models'
import {
  commonNotExistsId,
  commonDateMustGreaterThan,
  orderTypeNotExists,
  vendorCustomerCannotBeSame,
  customerNotBelongsToVendor,
  commonNotActiveId,
  orderUpdateInvalidStatus,
} from '../../customValidator'
import { orderOrderedQtyNotNull } from '../../orderValidator'
import { ORDER_TYPE, USER_ROLE } from '../../../helpers/constants'
import { entityActivityDateValidator } from '../entityActivityDateValidator'

const orderItemKFA93 = [
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
    .custom(commonNotActiveId('MasterMaterial', 'id.material_id'))
    .custom(orderMaterialEntity)
    .custom(orderedQtyWrongPieces),
]

const orderItemKFA92 = [
  body('order_items.*.children')
    .optional({nullable: true})
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_items') + ' Children'
    })),
  body('order_items.*.code_kfa_product_template')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Code KFA Product Template'
    })),
  body('order_items.*.children.*.ordered_qty')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.ordered_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') })),
  body('order_items.*.children.*.material_id')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') }))
    .custom(commonNotActiveId('MasterMaterial', 'id.material_id'))
    .custom(orderMaterialEntity)
    .custom(orderedQtyWrongPieces),
]

const orderItems = [
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
  ...process.env.APP_SERVICE === 'logistic' ? orderItemKFA92 : orderItemKFA93
]

const onlyOrderItems = [
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
  ...orderItemKFA93
]

const general = [
  body('required_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.required_date')
    }))
    .custom(commonDateMustGreaterThan('field.order.required_date', null, { isCurrentDate: true })),
  body('order_reason')
    .optional()
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_reason')
    })),
  body('estimated_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.estimated_date')
    })),
  ...orderItems,
]

async function orderMaterialEntity(value, { req }) {
  const { vendor_id } = req.body
  if (value && vendor_id) {
    const materialEntity = await models.EntityMasterMaterial.findOne({
      where: { master_material_id: value, entity_id: vendor_id },
    })
    if (!materialEntity) throw Error(req.__('custom.material_not_exist_vendor'))
  }

  return true
}

async function orderedQtyWrongPieces(value, { req }) {
  const { order_items: orderItems } = req.body
  const order = orderItems.find((item) => Number(item.material_id) === Number(value))
  if (value && order) {
    const material = await models.MasterMaterial.findByPk(value)
    if (material) {
      const { pieces_per_unit } = material
      const mod = Number(order.ordered_qty) % Number(pieces_per_unit)
      if (mod !== 0) throw Error(req.__('custom.qty_not_pieces_unit'))
    }
  }

  return true
}

export async function orderCheckDuplicateBatch(value, { req }) {
  if (value) {
    var valueArr = value.map(function (item) { return item.code })
    var isDuplicate = valueArr.some(function (item, idx) {
      return valueArr.indexOf(item) != idx
    })

    if (isDuplicate) {
      throw Error('Batch tidak boleh duplikat')
    }
  }

  return true
}

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
  body('activity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.activity_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.activity_id')
    }))
    .custom(commonNotExistsId('MasterActivity', 'id.activity_id'))
    .custom(isOrderSales()),
  body('type')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.type')
    }))
    .custom(orderTypeNotExists),
  body()
    .custom(checkEntityActivityDate),
  ...general,

]

const checkOrderId = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.order.id')
    }))
    .custom(commonNotExistsId('Order', 'order.id'))
    .custom(orderUpdateInvalidStatus),
]

export const update = [
  ...checkOrderId,
  body('order_items.*.id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.order_item_id')
    })),
  ...general,
]

export const insertOrderItem = [
  ...checkOrderId,
  ...onlyOrderItems,
  body('order_items.*')
    .custom(materialAlreadyBelongsToOrder),
]

export const insertOrderItemKfa = [
  ...checkOrderId,
  ...orderItems
]

async function materialAlreadyBelongsToOrder(value, { req }) {
  const { id } = req.params
  const { material_id } = value
  if (material_id && id) {
    const orderItem = await models.OrderItem.count({
      where: { order_id: id, master_material_id: material_id },
    })
    if (orderItem > 0) throw Error(req.__('custom.material_already_to_order'))
  }

  return true
}

function isOrderSales() {
  return async function (value, { req }) {
    const { user } = req
    const activity_id = value
    const activityD = await models.MasterActivity.findByPk(activity_id, {
      attributes: models.MasterActivity.getBasicAttribute()
    })
    if (!activityD?.is_ordered_sales && (user.role == USER_ROLE.MANAGER || user.role == USER_ROLE.OPERATOR)) {
      throw Error(req.__('validator.unable_order'))
    }
    return true
  }
}

async function checkEntityActivityDate(value, { req }) {
  const { customer_id, activity_id } = req.body

  return entityActivityDateValidator(customer_id, activity_id, req)
}