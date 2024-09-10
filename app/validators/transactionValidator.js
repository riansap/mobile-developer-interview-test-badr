import { body, param } from 'express-validator'
import { MATERIAL_TAG, STOCK_STATUS, TRANSACTION_TYPE, USER_ROLE } from '../helpers/constants'
import {
  commonNotExistsId,
  constantNotExist,
  commonNotActiveId
} from './customValidator'
import models from '../models'

export const create = [
  body()
    .isArray(),
  body('*.transaction_type_id')
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.id.transaction_type_id')
    }))
    .custom(commonNotExistsId('TransactionType', 'id.transaction_type_id')),
  body('*.transaction_reason_id')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.id.transaction_reason_id')
    }))
    .custom(commonNotExistsId('TransactionReason', 'id.transaction_reason_id')),
  body('*.status_id')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.stock.status')
    }))
    .custom(constantNotExist(STOCK_STATUS, 'field.stock.status')),
  body('*.material_id')
    .notEmpty()
    .withMessage((value, {req}) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.id.material_id')
    }))
    .custom(commonNotActiveId('Material', 'id.material_id')),
  body('*.stock_id')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.id.stock_id')
    }))
    .custom(commonNotExistsId('Stock', 'id.stock_id')),
  body('*.customer_id')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.id.customer_id')
    }))
    .custom(commonNotActiveId('Entity', 'id.customer_id')),
  body('*.vendor_id')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.id.vendor_id')
    }))
    .custom(commonNotActiveId('Entity', 'id.vendor_id')),
  body('*.change_qty')
    .exists()
    .isInt({ min: 0 })
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.transaction.change_qty')
    })),
  body('*.created_at')
    .optional()
    .isString()
    .withMessage((value, {req}) => req.__('validator.string', {
      field: req.__('field.transaction.created_at')
    })),
  // .custom(checkDateTime('field.transaction.created_at', 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]')),
  body('*.is_batches')
    .exists()
    .isBoolean()
    .withMessage((value, {req}) => req.__('validator.boolean', {
      field: req.__('field.transaction.is_batches')
    })),
  body('*.batch.code')
    .optional()
    .isString()
    .withMessage((value, {req}) => req.__('validator.string', {
      field: req.__('field.batch.code')
    })),
  body('*.batch.expired_date')
    .optional(),
  // .custom(checkDateTime('field.batch.expired_date', 'YYYY-MM-DD')),
  body('*.batch.production_date')
    .optional(),
  // .custom(checkDateTime('field.batch.production_date', 'YYYY-MM-DD')),
  body('*.batch.manufacture_id')
    .optional()
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.batch.manufacture_id')
    }))
    .custom(commonNotExistsId('Manufacture', 'batch.manufacture_id')),
  body('*.dose_1')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.dose_1')
    })),
  body('*.dose_2')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.dose_2')
    })),
  body('*.booster')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.booster')
    })),
  body('*')
    // .custom(changeQtyNotMatch)
    .custom(transactionReasonNotMatch)
    .custom(checkPiecePerUnitNotMatch)
    .custom(checkQtyAvailable)
    .custom(checkStockBatchMatch)
    .custom(checkTransactionTypeCustomer)
    .customSanitizer(sanitizeDoseBooster)
]

export const injection = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.transaction.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.transaction.id')
    }))
    .custom(checkTransactionInjection),
  body('dose_1')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.injection.dose_1')
    })),
  body('dose_2')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.injection.dose_2')
    })),
  body('dose_booster')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.injection.dose_booster')
    })),
  body('dose_routine')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, {req}) => req.__('validator.number', {
      field: req.__('field.injection.dose_routine')
    }))
]

export async function transactionReasonNotMatch(value, { req }) {
  let { transaction_reason_id, transaction_type_id, broken_qty, other_reason } = value
  if(parseInt(broken_qty) > 0 && !transaction_reason_id) {
    throw Error(req.__('validator.not_exist', { field: req.__('field.id.transaction_reason_id') }))
  }
  if(transaction_reason_id) {
    if(transaction_type_id === TRANSACTION_TYPE.RETURN) transaction_type_id = TRANSACTION_TYPE.DISCARDS
    const data = await models.TransactionReason.findOne({
      where: { id: transaction_reason_id , transaction_type_id: transaction_type_id}
    })
    if (!data) throw Error(req.__('validator.not_exist', { field: req.__('field.id.transaction_reason_id') }))
    if(data.is_other && !other_reason) throw Error(req.__('validator.not_empty', { field: req.__('field.transaction_reason.other_reason') }))
  }

  return true
}

// export async function changeQtyNotMatch(value, { req }) {
//   const { change_qty, stock_id, transaction_type_id } = value
//   const type = await models.TransactionType.findByPk(transaction_type_id)
//   var data = null
//   if(stock_id) {
//     data = await models.Stock.findOne({
//       where: { id: stock_id }
//     })
//   }
//   if (type.can_remove && data && change_qty > data.qty) {
//     throw Error(req.__('validator.lesser_or_equal', { 
//       field1: req.__('field.transaction.change_qty') + ' ('+ change_qty +')', 
//       field2: req.__('field.stock.qty') + ' ('+ (data.qty || 0) +')'
//     }))
//   }

//   return true
// }

export async function checkPiecePerUnitNotMatch(value, { req }) {
  const { change_qty, material_id } = value
  
  const data = await models.Material.findOne({
    where: { id: material_id }
  })
  if ( data && change_qty !== 0 && !Number.isInteger(change_qty/data.pieces_per_unit) ) {
    throw Error(req.__('validator.multiple_format', { 
      field: req.__('field.transaction.change_qty'), 
      format: data.pieces_per_unit
    }))
  }

  return true
}

export async function checkQtyAvailable(value, { req }) {
  const { change_qty, transaction_type_id, stock_id } = value
  const transactionType = await models.TransactionType.findOne({
    where: {id: transaction_type_id}
  })
  if(stock_id) {
    const data = await models.Stock.findOne({
      where: { id: stock_id },
      with_order_stocks: true
    })
    if (data) {
      if(transactionType.can_remove) {
        if( change_qty > data.available ) {
          throw Error(req.__('validator.lesser_or_equal', { 
            field1: req.__('field.transaction.change_qty') + `(${change_qty})`, 
            field2: req.__('field.stock.available') + `(${data.available})`
          }))
        }
      } else if(transactionType.can_restock) {
        if( change_qty < data.allocate ) {
          throw Error(req.__('validator.greater_than', { 
            field1: req.__('field.transaction.change_qty') + `(${change_qty})`, 
            field2: req.__('field.id.allocated_stock_id') + `(${data.allocate})`
          }))
        }
      }
    }
  } else {
    if(transactionType.can_remove) {
      throw Error(req.__('validator.lesser_or_equal', { 
        field1: req.__('field.transaction.change_qty') + `(${change_qty})`, 
        field2: req.__('field.stock.available') + '(0)'
      }))
    }
  }
  return true
}

export async function checkStockBatchMatch(value, { req }) {
  const { batch, stock_id } = value
  if(stock_id && batch && batch.code) {
    let batchData = null

    // disable batch expired
    // if(transaction_type_id !== TRANSACTION_TYPE.DISCARDS) {
    //   batchData = await models.Batch.scope('not_expired').findOne({
    //     where: { code: batch.code }
    //   })
    // } else {
    batchData = await models.Batch.findOne({
      where: { code: batch.code }
    })
    // }
    
    if(!batchData) {
      throw Error(req.__('custom.batch_expired', { batch: batch.code }))
    }
    const data = await models.Stock.findOne({
      where: [
        { id: stock_id },
        { batch_id: batchData.id }
      ]
    })
    if (!data) {
      throw Error(req.__('validator.not_exist', { 
        field: req.__('field.id.stock_id') + ' and ' + req.__('field.id.batch_id'),
      }))
    }
  }
  return true
}

export async function checkTransactionTypeCustomer(value, { req }) {
  let { transaction_type_id, customer_id, material_id } = value
  let { entity_id } = req.user
  if(req.user.role === USER_ROLE.SUPERADMIN) {
    entity_id = value.entity_id
  }
  transaction_type_id = parseInt(transaction_type_id)
  switch (transaction_type_id) {
  case TRANSACTION_TYPE.ISSUES:
    if (!customer_id) {
      throw Error('Transaksi pengeluaran harus memiliki Pelanggan')
    }
    break
  case TRANSACTION_TYPE.RETURN: {
    const isConsumption = await models.CustomerVendor.count({
      where: [
        { customer_id: customer_id },
        { vendor_id: entity_id },
        { is_consumption: 1 }
      ]
    })
    if(!isConsumption) {
      throw Error('Only allowed to consumption customer')
    }
    break
  }
  case TRANSACTION_TYPE.STOCK_COUNT:
  case TRANSACTION_TYPE.ADD_STOCK: 
  case TRANSACTION_TYPE.REMOVE_STOCK: {
    const isStockCount = transaction_type_id === TRANSACTION_TYPE.STOCK_COUNT ? true : false
    const label = isStockCount ? 'Hitung Stok' : 'Tambah/kurangi Stok'
    let entityType = req.user.entity?.type || null
    let role = req.user.role
    if(role === USER_ROLE.SUPERADMIN) {
      return true
    }

    const materialOpt = [
      { id: material_id }
    ]
    if(isStockCount) materialOpt.push({ is_stockcount: 1 })
    else materialOpt.push({ is_addremove: 1 })

    let canTransaction = await models.Material.count({
      where: materialOpt
    })
    if(!canTransaction) {
      throw Error(`Anda tidak dapat melakukan ${label} pada material ini`)
    }

    const materialConditionOpt = [
      { material_id: material_id }
    ]
    if(isStockCount) materialConditionOpt.push({ type: TRANSACTION_TYPE.STOCK_COUNT })
    else materialConditionOpt.push({ type: TRANSACTION_TYPE.ADD_STOCK })

    const checkRole = await models.MaterialCondition.count({
      where: [...materialConditionOpt, { key: 'roles' }, { value: role }]
    })
    const checkEntityType = await models.MaterialCondition.count({
      where: [...materialConditionOpt, { key: 'entity_types' }, { value: entityType }]
    })
    if(!checkRole || !checkEntityType) {
      throw Error(`Anda tidak dapat melakukan ${label} pada material ini`)
    }
    break
  }
  default:
    break
  }
  return true
}

export async function sanitizeDoseBooster(value, { req }) {
  let { transaction_type_id, material_id } = value
  if (transaction_type_id === TRANSACTION_TYPE.ISSUES) {
    // check tag covid
    const isMaterialCovid = await models.Material.count({
      where: [{ id: material_id }, { managed_in_batch: 1 }],
      include: {
        association: 'material_tags',
        where: { id: MATERIAL_TAG.COVID },
        required: true,
      },
    })
    if (isMaterialCovid) {
      value.booster = value.booster !== null ? parseInt(value.booster) : null
      value.dose_1 = value.dose_1 !== null ? parseInt(value.dose_1) : null
      value.dose_2 = value.dose_2 !== null ? parseInt(value.dose_2) : null
      return value
    }
  }
  return {
    ...value,
    booster: null,
    dose_1: null,
    dose_2: null
  }
}

export async function checkTransactionInjection(value, { req }) {
  let { id } = req.params
  let transaction = await models.Transaction.findOne({ where: { id: id } })
  if (transaction.transaction_type_id !== TRANSACTION_TYPE.ISSUES) {
    throw Error(req.__('field.injection.transaction_issues'))
  }
  if (transaction.order_id !== null) {
    throw Error(req.__('field.injection.order_null'))
  }

  const isMaterialCovid = await models.Material.count({
    where: [{ id: transaction.material_id }, { managed_in_batch: 1 }],
    include: {
      association: 'material_tags',
      where: { id: MATERIAL_TAG.COVID },
      required: true,
    },
  })
  
  let changeQty = transaction.change_qty * 1
    
  if (isMaterialCovid) {
    let { dose_1, dose_2, dose_booster } = req.body
    console.log(dose_1, dose_2, dose_booster)
    if (!dose_1 && !dose_2 && !dose_booster) {
      throw Error(req.__('field.injection.entry_dose'))
    }
    if (dose_1 > changeQty || dose_2 > changeQty || dose_booster > changeQty) {
      throw Error(req.__('field.injection.over_qty'))
    }

    let totalDose = dose_1 + dose_2 + dose_booster
    if (totalDose > changeQty) {
      throw Error(req.__('field.injection.over_qty'))
    }
  } else {
    let { dose_routine } = req.body
    if (!dose_routine) {
      throw Error(req.__('field.injection.entry_dose'))
    }
    if (dose_routine > changeQty) {
      throw Error(req.__('field.injection.over_qty'))
    }
  }

  return true
}
