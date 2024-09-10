import { body } from 'express-validator'

import {
  commonNotExistsField,
  commonDateMustGreaterThan,
  vendorCustomerCannotBeSame,
  customerNotBelongsToVendor,
} from '../../customValidator'
import { orderCheckDuplicateBatch } from '../../orderValidator'
import { USER_ROLE } from '../../../helpers/constants'

import models from '../../../models'
import { entityActivityDateValidator } from '../entityActivityDateValidator'

export const create = [
  body('customer_code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.customer_code')
    }))
    .customSanitizer((value, { req }) => {
      return value?.toString() || ''
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
  body('is_manual')
    .optional()
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: 'is_manual' }))
    .isInt({ min: 0, max: 1 }),
  body('order_items')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.order_items')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_items')
    })),
  body('order_items.*')
    .custom(orderDroppingQtyWrongPieces)
    .custom(orderDroppingCheckStock),
  body('order_items.*.stocks.*.qty')
    .optional()
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') })),
  body('order_items.*.batches.*.qty')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.ordered_qty')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.order.ordered_qty') })),
  body('order_items.*.material_code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.material_code')
    }))
    .custom(orderDroppingMaterialEntityNoExists),
  body('order_items.*.batches.*.manufacture_name')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order_covid.manufacture_name')
    }))
    .custom(commonNotExistsField('Manufacture', 'name', 'order_covid.manufacture_name')),
  body('order_items.*.batches.*.production_date')
    .customSanitizer((value) => {
      if (!value) return null
      return value
    })
    .optional({ nullable: true })
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

  body('order_items.*.batches.*.price')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.price') })),
  body('order_items.*.batches.*.total_price')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.total_price') })),
  body('order_items.*.batches.*.year')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.year') })),
  body('order_items.*.batches.*.source_material_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.id.source_material_id') }))
    .custom(commonNotExistsField('SourceMaterial', 'id', 'id.source_material_id')),
  body('order_items.*.batches.*.pieces_purchase_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.id.pieces_purchase_id') }))
    .custom(commonNotExistsField('PiecesPurchase', 'id', 'id.pieces_purchase_id')),
  body('order_items.*.batches')
    .custom(orderCheckDuplicateBatch),
  body('order_items.*.batches.*.activity_id')
    .custom(isOrderPurchase()),
  body('delivery_number')
    .optional({ nullable: true }),
  body()
    .custom(checkEntityActivityDate),
]

async function checkEntityActivityDate(value, { req }) {
  const { vendor_code, activity_id } = req.body

  const entity = await models.Entity.findOne({ where: { code: vendor_code } })
  const entityId = entity.id

  return entityActivityDateValidator(entityId, activity_id, req)
}

async function orderDroppingMaterialEntityNoExists(value, { req }) {
  if (value) {
    let vendor_id

    if (req.user.role === USER_ROLE.SUPERADMIN) {
      var vendor_code = ''
      if (req.body.vendor_code)
        vendor_code = req.body.vendor_code
      else {
        const { entity } = req.user
        vendor_code = entity.code
      }
      const vendor = await models.Entity.findOne({ where: { code: vendor_code } })
      vendor_id = vendor.id
    } else {
      vendor_id = req.user.entity_id
    }


    const material = await models.MasterMaterial.findOne({ where: { code: value } })
    if (!material) throw Error(req.__('validator.not_exist', { field: req.__('field.order_covid.material_code') }))
    const materialEntity = await models.EntityMasterMaterial.count({
      where: { master_material_id: material.id, entity_id: vendor_id },
    })
    if (!materialEntity) throw Error(req.__('validator.not_exist', { field: req.__('field.id.material_entity_id') }))
  }

  return true
}

async function orderDroppingQtyWrongPieces(value, { req }) {
  const { batches, stocks, material_code } = value

  const material = await models.MasterMaterial.findOne({
    where: { code: material_code },
  })
  const stockToCheck = material.managed_in_batch ? batches : stocks

  if (!stockToCheck || stockToCheck.length < 1) {
    throw Error('Stock/Batches harus ada')
  }

  let activityMaterial = await material.getMaterial_activities() ?? []
  activityMaterial = activityMaterial.map(activity => activity.id)

  stockToCheck.forEach((stock) => {
    const { qty, activity_id } = stock
    const { pieces_per_unit } = material
    const mod = Number(qty) % Number(pieces_per_unit)
    if (mod !== 0) throw Error(req.__('custom.qty_not_pieces_unit'))
    // check activity id
    if (!activity_id) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.id.activity_id'),
      }))
    }
    if (!activityMaterial.includes(parseInt(activity_id))) {
      throw Error(req.__('validator.not_exist', {
        field: req.__('field.id.activity_id'),
      }))
    }
  })
  return true
}

async function orderDroppingCheckStock(value, { req }) {
  const { entity_id, role, manufacture_id } = req.user
  const { material_code, qty, batches, stocks } = value
  let hasVendor = false
  if (entity_id) {
    const vendor = await models.Entity.findByPk(entity_id)
    if (vendor) {
      const vendors = await vendor.getVendors()
      if (vendors.length > 0) hasVendor = true
    }
  }

  let manufacture_type = null
  if (role == 11) {
    const manufacture = await models.Manufacture.findByPk(manufacture_id)
    manufacture_type = manufacture.type
  }


  if (material_code && hasVendor && !(role == 11 && manufacture_type == 1)) {
    const material = await models.MasterMaterial.findOne({
      where: { code: material_code },
    })
    const vendorMaterialEntity = await models.EntityMasterMaterial.findOne({
      where: { master_material_id: material.id, entity_id },
    })
    if (!vendorMaterialEntity) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.id.material_entity_id'),
      }))
    }

    const isBatches = material.managed_in_batch
    if (isBatches) {
      // check per batches
      for (let batchBody of batches) {
        let { code, manufacture_name, activity_id } = batchBody
        const manufacture = await models.Manufacture.findOne({
          where: { name: manufacture_name },
        })
        if (!manufacture) {
          throw Error(req.__('validator.not_empty', {
            field: req.__('field.order_covid.manufacture_name'),
          }))
        }
        const batch = await models.Batch.findOne({
          where: { code: code, manufacture_id: manufacture.id },
        })
        if (!batch) {
          throw Error(req.__('validator.not_exist', {
            field: `${req.__('field.id.batch_id')} (${code})`,
          }))
        }

        const vendorStock = await models.Stock.findOne({
          where: { batch_id: batch.id, entity_has_material_id: vendorMaterialEntity.id, activity_id },
        })
        if (!vendorStock) {
          throw Error(req.__('validator.not_exist', {
            field: `Vendor ${req.__('field.id.stock_id')} (Batch ${batch.id})`,
          }))
        }
        // ordered_qty
        if (Number(vendorStock.qty) < qty) {
          throw Error(req.__('validator.greater_than', {
            field1: `Vendor ${req.__('field.id.stock_id')} (Batch ${batch.id})`,
            field2: req.__('field.order.ordered_qty'),
          }))
        }

        if (Number(vendorStock.qty) <= 0) {
          throw Error(req.__('validator.greater_than', {
            field1: `Vendor ${req.__('field.id.stock_id')} (Batch ${batch.id})`,
            field2: '0',
          }))
        }
      }
    } else {
      // check qty
      for (let stockBody of stocks) {
        let { id, qty, activity_id } = stockBody
        const vendorStock = await models.Stock.findOne({
          where: { batch_id: null, id, entity_has_material_id: vendorMaterialEntity.id, activity_id },
        })
        if (!vendorStock) {
          throw Error(req.__('validator.not_empty', {
            field: `Vendor ${req.__('field.id.stock_id')}`,
          }))
        }
        if (Number(vendorStock.qty) < qty) {
          throw Error(req.__('validator.greater_than', {
            field1: `Vendor ${req.__('field.id.stock_id')}`,
            field2: req.__('field.order.ordered_qty'),
          }))
        }

        if (Number(vendorStock.qty) <= 0) {
          throw Error(req.__('validator.greater_than', {
            field1: `Vendor ${req.__('field.id.stock_id')}`,
            field2: '0',
          }))
        }
      }
    }
  }
  return true
}


function isOrderPurchase() {
  return async function (value, { req }) {
    //temporary disable this validator, need confirm first for permanent remove
    /*const { user } = req
    const activity_id = value
    const activityD = await models.MasterActivity.findByPk(activity_id, {
      attributes: models.MasterActivity.getBasicAttribute()
    })
    if (!activityD?.is_ordered_purchase && (user.role == USER_ROLE.MANAGER || user.role == USER_ROLE.OPERATOR)) {
      throw Error(req.__('validator.unable_order'))
    }*/
    return true
  }
}