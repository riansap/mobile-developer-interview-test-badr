import { body, param } from 'express-validator'
import moment from 'moment'

import { isTrxUseOpenVial, MATERIAL_TAG, MATRIX_RULE_RABIES, STOCK_STATUS, TRANSACTION_TYPE, USER_ROLE } from '../../helpers/constants'
import { checkDateTime, commonNotActiveId, commonNotExistsId, constantNotExist } from '../customValidator'
import models from '../../models'
import { doEncrypt } from '../../helpers/common'
import { entityActivityDateValidator } from './entityActivityDateValidator'
import _, { isArray } from 'lodash'

export const cancelDiscard = [
  body('transaction_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.transaction_type_id')
    })),
  body('change_qty')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: 'Change Qty'
    })),
  body('qty')
    .if((value, { req }) => !req.body.transaction_id)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Qty'
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: 'Qty'
    }))
    .isInt({ min: 1 }),
  body('batch_id')
    .if((value, { req }) => !req.body.transaction_id)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Batch ID'
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: 'Batch ID'
    })),
  body('entity_id')
    .if((value, { req }) => !req.body.transaction_id)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.entity_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.entity_id')
    })),
  body('master_material_id')
    .if((value, { req }) => !req.body.transaction_id)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.material_id')
    })),
  body('transaction_reason_id')
    .if((value, { req }) => !req.body.transaction_id)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.transaction_reason_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.transaction_reason_id')
    })),
  body('date')
    .if((value, { req }) => !req.body.transaction_id)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Date'
    }))
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date_format', { field: 'Date', format: 'YYYY-MM-DD' }))
]

export const create = [
  body()
    .isArray(),
  body('*.transaction_type_id')
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.transaction_type_id')
    }))
    .custom(commonNotExistsId('TransactionType', 'id.transaction_type_id')),
  body('*.transaction_reason_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.transaction_reason_id')
    }))
    .custom(commonNotExistsId('TransactionReason', 'id.transaction_reason_id')),
  body('*.status_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.stock.status')
    }))
    .custom(constantNotExist(STOCK_STATUS, 'field.stock.status')),
  body('*.material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.material_id')
    }))
    .custom(commonNotActiveId('MasterMaterial', 'id.material_id')),
  body('*.activity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.activity_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.activity_id')
    }))
    .custom(commonNotExistsId('MasterActivity', 'id.activity_id')),
  body('*.stock_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.stock_id')
    }))
    .custom(commonNotExistsId('Stock', 'id.stock_id')),
  body('*.customer_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.customer_id')
    }))
    .custom(commonNotActiveId('Entity', 'id.customer_id')),
  body('*.vendor_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.vendor_id')
    }))
    .custom(commonNotActiveId('Entity', 'id.vendor_id')),
  body('*.change_qty')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.transaction.change_qty')
    })),
  body('*.open_vial')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.transaction.open_vial')
    })),
  body('*.close_vial')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.transaction.close_vial')
    })),
  body('*.saved_at')
    .optional()
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.transaction.created_at')
    })),
  body('*.is_batches')
    .exists()
    .isBoolean()
    .withMessage((value, { req }) => req.__('validator.boolean', {
      field: req.__('field.transaction.is_batches')
    })),
  body('*.batch.code')
    .optional()
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.batch.code')
    })),
  body('*.batch.expired_date')
    .optional(),
  body('*.batch.production_date')
    .optional(),
  body('*.batch.manufacture_id')
    .optional()
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.batch.manufacture_id')
    }))
    .custom(commonNotExistsId('Manufacture', 'batch.manufacture_id')),
  body('*.dose_1')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.dose_1')
    })),
  body('*.dose_2')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.dose_2')
    })),
  body('*.booster')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.booster')
    })),
  body('*.source_material_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.source_material_id')
    }))
    .custom(commonNotExistsId('SourceMaterial', 'id.source_material_id')),
  body('*.pieces_purchase_id')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.pieces_purchase_id')
    }))
    .custom(commonNotExistsId('PiecesPurchase', 'id.pieces_purchase_id')),
  body('*.year')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.year')
    })),
  body('*.price')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.price')
    })),
  body('*.total_price')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.total_price')
    })),
  body('*.actual_transaction_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.transaction.actual_transaction_date')
    })),
  body('*.transaction_patients.*')
    .custom(patientValidates),
  body('*.transaction_patients')
    .optional({ nullable: false })
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: 'Transaction Patients'
    })),
  body('*.transaction_patients.*.vaccine_sequence')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.transaction.vaccine_sequence')
    }))
    .isInt({ min: 1, max: 7 }),
  body('*.transaction_patients.*.patient_id')
    .notEmpty()
    .withMessage((value, {req})=> req.__('validator.not_empty', {
      field: req.__('field.transaction.patient_id')
    }))
  ,
  body('*')
    .custom(checkPatientReturn)
    .custom(transactionReasonNotMatch)
    .custom(checkPiecePerUnitNotMatch)
    .custom(checkQtyAvailable)
    .custom(checkStockBatchMatch)
    .custom(checkBatchManufacture)
    .custom(checkTransactionTypeCustomer)
    .custom(checkReturnQty)
    .customSanitizer(sanitizeDoseBooster)
    .custom(checkTransactionDiscard)
    .custom(checkPatientNeed)
    .custom((value, { req }) => {
      const { entity_id, activity_id } = value
      return entityActivityDateValidator(entity_id, activity_id, req)
    })
]

export const createDummy = [
  body()
    .custom((value, { req }) => {
      const { entity_id, activity_id } = req.body

      return entityActivityDateValidator(entity_id, activity_id, req)
    })
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
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.injection.dose_1')
    })),
  body('dose_2')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.injection.dose_2')
    })),
  body('dose_booster')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.injection.dose_booster')
    })),
  body('dose_routine')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.injection.dose_routine')
    }))
]

export async function transactionReasonNotMatch(value, { req }) {
  let { transaction_reason_id, transaction_type_id, broken_qty, other_reason, broken_close_vial, broken_open_vial } = value

  let hasBroken = false
  if (parseInt(broken_qty) > 0 || parseInt(broken_close_vial) > 0 || parseInt(broken_open_vial) > 0) {
    hasBroken = true
  }

  let isDiscards = transaction_type_id === TRANSACTION_TYPE.DISCARDS ? true : false

  if (hasBroken && !transaction_reason_id) {
    throw Error(req.__('validator.not_empty', { field: req.__('field.id.transaction_reason_id') }))
  }
  // if(isDiscards && !transaction_reason_id) {
  //   throw Error(req.__('validator.not_empty', { field: req.__('field.id.transaction_reason_id') }))
  // }

  if (transaction_reason_id) {
    if (transaction_type_id === TRANSACTION_TYPE.RETURN) transaction_type_id = TRANSACTION_TYPE.DISCARDS
    const data = await models.TransactionReason.findOne({
      where: { id: transaction_reason_id, transaction_type_id: transaction_type_id }
    })
    if (!data) throw Error(req.__('validator.not_exist', { field: req.__('field.id.transaction_reason_id') }))
    if (data.is_other && !other_reason) throw Error(req.__('validator.not_empty', { field: req.__('field.transaction_reason.other_reason') }))
  }

  return true
}

export async function checkPiecePerUnitNotMatch(value, { req }) {
  const { change_qty, material_id, close_vial, transaction_type_id } = value

  const data = await models.MasterMaterial.findOne({
    where: { id: material_id }
  })
  let isUseOpenVial = isTrxUseOpenVial(transaction_type_id, data.is_openvial ? true : false)
  if (!isUseOpenVial) {
    if (change_qty !== 0 && !Number.isInteger(change_qty / data.pieces_per_unit)) {
      throw Error(req.__('validator.multiple_format', {
        field: req.__('field.transaction.change_qty'),
        format: data.pieces_per_unit
      }))
    }
  } else {
    if (close_vial !== 0 && !Number.isInteger(close_vial / data.pieces_per_unit)) {
      throw Error(req.__('validator.multiple_format', {
        field: req.__('field.transaction.close_vial'),
        format: data.pieces_per_unit
      }))
    }
  }

  return true
}

export async function checkQtyAvailable(value, { req }) {
  let { change_qty, transaction_type_id, stock_id, material_id, open_vial, close_vial } = value
  const transactionType = await models.TransactionType.findOne({
    where: { id: transaction_type_id }
  })
  const isOpenVial = await models.MasterMaterial.count({ where: [{ id: material_id, is_openvial: 1 }] })
  const useOpenVial = isTrxUseOpenVial(transaction_type_id, isOpenVial ? true : false)
  if (useOpenVial) {
    if (!open_vial && !close_vial) {
      throw Error(req.__('validator.not_empty', {
        field: `${req.__('field.transaction.open_vial')}, ${req.__('field.transaction.close_vial')}`,
      }))
    }
    change_qty = close_vial
  }

  if (stock_id) {
    const data = await models.Stock.findOne({
      where: { id: stock_id },
      // with_order_stocks: true
    })
    if (data) {
      if (transactionType.can_remove) {
        if (change_qty > data.available) {
          throw Error(req.__('validator.lesser_or_equal', {
            field1: req.__('field.transaction.change_qty') + `(${change_qty})`,
            field2: req.__('field.stock.available') + `(${data.available})`
          }))
        }
        if (useOpenVial) {
          if (open_vial > data.open_vial) {
            throw Error(req.__('validator.lesser_or_equal', {
              field1: req.__('field.transaction.open_vial') + `(${open_vial})`,
              field2: req.__('field.stock.open_vial') + `(${data.open_vial})`
            }))
          }
        }
      } else if (transactionType.can_restock) {
        if (change_qty < data.allocate) {
          throw Error(req.__('validator.greater_than', {
            field1: req.__('field.transaction.change_qty') + `(${change_qty})`,
            field2: req.__('field.id.allocated_stock_id') + `(${data.allocate})`
          }))
        }
      }
    }
  } else {
    if (transactionType.can_remove) {
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
  if (stock_id && batch && batch.code) {
    let batchData = null

    batchData = await models.Batch.findOne({
      where: { code: batch.code }
    })

    if (!batchData) {
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
  if (req.user.role === USER_ROLE.ADMIN || req.user.role === USER_ROLE.SUPERADMIN || req.user.role === USER_ROLE.ASIK) {
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
      if (!isConsumption) {
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
      if (role === USER_ROLE.SUPERADMIN) {
        return true
      }

      const materialOpt = [
        { id: material_id }
      ]
      if (isStockCount) materialOpt.push({ is_stockcount: 1 })
      else materialOpt.push({ is_addremove: 1 })

      let canTransaction = await models.MasterMaterial.count({
        where: materialOpt
      })
      if (!canTransaction) {
        throw Error(`Anda tidak dapat melakukan ${label} pada material ini`)
      }

      // const materialConditionOpt = [
      //   { material_id: material_id }
      // ]
      // if(isStockCount) materialConditionOpt.push({ type: TRANSACTION_TYPE.STOCK_COUNT })
      // else materialConditionOpt.push({ type: TRANSACTION_TYPE.ADD_STOCK })

      // const checkRole = await models.MaterialCondition.count({
      //   where: [...materialConditionOpt, { key: 'roles' }, { value: role }]
      // })
      // const checkEntityType = await models.MaterialCondition.count({
      //   where: [...materialConditionOpt, { key: 'entity_types' }, { value: entityType }]
      // })
      // if(!checkRole || !checkEntityType) {
      //   throw Error(`Anda tidak dapat melakukan ${label} pada material ini`)
      // }
      break
    }
    default:
      break
  }
  return true
}

export async function sanitizeDoseBooster(value, { req }) {
  let { transaction_type_id, activity_id } = value
  if (transaction_type_id === TRANSACTION_TYPE.ISSUES) {
    if (activity_id === MATERIAL_TAG.COVID) {
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

async function checkTransactionDiscard(value, { req }) {
  let { transaction_id, stock_id, transaction_type_id, material_id: master_material_id, change_qty } = value

  if (transaction_type_id == TRANSACTION_TYPE.CANCEL_DISCARD) {
    if (!transaction_id) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.transaction.id')
      }))
    } else if (!Array.isArray(transaction_id)) {
      throw Error(req.__('validator.array', {
        field: req.__('field.transaction.id')
      }))
    } else {
      const transactions = await models.Transaction.findAll({
        where: { id: transaction_id, transaction_type_id: TRANSACTION_TYPE.DISCARDS }
      })

      if (transactions.length <= 0) {
        throw Error(req.__('validator.not_exist', {
          field: req.__('field.transaction.id'),
        }))
      }

      let totalQty = 0
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i]

        totalQty += transaction.change_qty

        const payload = {
          stock_id,
          transaction_reason_id: transaction.transaction_reason_id
        }

        let stockExtermination = await models.StockExtermination.findOne({
          where: { ...payload }
        })

        if (stockExtermination.extermination_discard_qty < transaction.change_qty) {
          let material = await models.MasterMaterial.findByPk(master_material_id)
          let stock = await models.Stock.findByPk(stock_id, {
            include: [
              { association: 'batch', attributes: ['code'] }
            ]
          })

          throw Error(req.__('validator.disposal_stock_insufficient', {
            material: material?.name || ''
          }))
        }
      }

      if (totalQty != change_qty) {
        throw Error(req.__('validator.same_value', {
          field1: req.__('field.transaction.change_qty'), field2: req.__('field.transaction.discard_qty')
        }))
      }
    }
  }
  return true
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

  const isMaterialCovid = transaction.activity_id === MATERIAL_TAG.COVID

  let changeQty = transaction.change_qty * 1

  if (isMaterialCovid) {
    let { dose_1, dose_2, dose_booster } = req.body
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

/*async function checkIsPurchase(value, {req}){
  const {year, price, total_price, source_material_id, transaction_reason_id} = value

  if(transaction_reason_id){
    const transactionReason = await models.TransactionReason.findOne({where : {id : transaction_reason_id, is_purchase : 1}})
    if(transactionReason){
      if(!year) throw Error(`${ req.__('validator.not_empty', {field: req.__('field.year')})}`)
      if(!price) throw Error(`${ req.__('validator.not_empty', {field: req.__('field.price')})}`)
      if(!total_price) throw Error(`${ req.__('validator.not_empty', {field: req.__('field.total_price')})}`)
      if(!source_material_id) throw Error(`${ req.__('validator.not_empty', {field: req.__('field.id.source_material_id')})}`)
    }
  }
  return true
}*/

async function countSumTransactionIssue({ field, transaction_type_id, trxOptions = [] }) {
  const total = await models.Transaction.sum(field, {
    where: [
      ...trxOptions,
      { transaction_type_id }
    ]
  })
  return total || 0
}

async function checkReturnQty(value, { req }) {
  var { change_qty, transaction_type_id, customer_id,
    material_id, open_vial, close_vial,
    stock_id, broken_qty, broken_open_vial,
    broken_close_vial, entity_id } = value
  let entityID = req.user.role === USER_ROLE.ADMIN || req.user.role === USER_ROLE.SUPERADMIN || req.user.role === USER_ROLE.ASIK ? entity_id : req.entityID

  const isOpenVial = await models.MasterMaterial.count({ where: [{ id: material_id, is_openvial: 1 }] })

  if (transaction_type_id === TRANSACTION_TYPE.RETURN) {
    // return cannot more than issue stock
    var trxOptions = [
      { master_material_id: material_id },
      { entity_id: entityID },
      { customer_id },
      { order_id: null },
      { stock_id },
    ]

    if (isOpenVial) {
      const issueCloseVial = await countSumTransactionIssue({
        field: 'change_qty',
        transaction_type_id: TRANSACTION_TYPE.ISSUES,
        trxOptions
      })
      const returnCloseVial = await countSumTransactionIssue({
        field: 'change_qty',
        transaction_type_id: TRANSACTION_TYPE.RETURN,
        trxOptions
      })
      let totalCloseVialIssue = (issueCloseVial * -1) - returnCloseVial

      if (close_vial > totalCloseVialIssue) {
        throw Error(req.__('validator.lesser_or_equal', {
          field1: req.__('field.transaction.close_vial') + `(${close_vial})`,
          field2: req.__('field.stock.qty') + `(${totalCloseVialIssue})`
        }))
      }
      if (broken_open_vial > open_vial) {
        throw Error(req.__('validator.lesser_or_equal', {
          field1: req.__('field.transaction.broken_open_vial') + `(${broken_open_vial})`,
          field2: req.__('field.transaction.open_vial') + `(${open_vial})`
        }))
      }
      if (broken_close_vial > close_vial) {
        throw Error(req.__('validator.lesser_or_equal', {
          field1: req.__('field.transaction.broken_close_vial') + `(${broken_close_vial})`,
          field2: req.__('field.transaction.close_vial') + `(${close_vial})`
        }))
      }
    } else {
      const issueStock = await countSumTransactionIssue({
        field: 'change_qty',
        transaction_type_id: TRANSACTION_TYPE.ISSUES,
        trxOptions
      })
      const returnStock = await countSumTransactionIssue({
        field: 'change_qty',
        transaction_type_id: TRANSACTION_TYPE.RETURN,
        trxOptions
      })
      let totalStockIssue = (issueStock * -1) - returnStock

      if (change_qty > totalStockIssue) {
        throw Error(req.__('validator.lesser_or_equal', {
          field1: req.__('field.transaction.change_qty') + `(${change_qty})`,
          field2: req.__('field.stock.qty') + `(${totalStockIssue})`
        }))
      }
      if (broken_qty > change_qty) {
        throw Error(req.__('validator.lesser_or_equal', {
          field1: req.__('field.transaction.broken_qty') + `(${broken_qty})`,
          field2: req.__('field.transaction.change_qty') + `(${change_qty})`
        }))
      }
    }

  }
  return true
}


// check if batch code is match with manufacture
async function checkBatchManufacture(value, { req }) {
  const { batch } = value

  if (batch) {
    const batchData = await models.Batch.findOne({
      where: { code: batch.code }
    })

    if (batchData) {
      req.warningMessage = ''
      if (batch.manufacture_id != batchData.manufacture_id) {
        req.warningMessage = req.__('custom.batch_exist', { batch: batch.code }) + '. '
      }


      const expDate_body = moment(batch.expired_date).format('YYYY-MM-DD')
      const expDate_batch = moment(batchData.expired_date).format('YYYY-MM-DD')

      if (expDate_batch != expDate_body) {
        req.warningMessage += req.__('custom.batch_exist_expired')
      }
    }

  }
  return true
}

async function checkPatientNeed(value, { req}) {
  let { activity_id, transaction_type_id, is_vaccine, transaction_patients } = value

  transaction_patients = transaction_patients ?? []

  if (transaction_type_id === TRANSACTION_TYPE.ISSUES || transaction_type_id === TRANSACTION_TYPE.RETURN) {
    const Activity = await models.MasterActivity.findByPk(activity_id)
    if (Activity) {
      if (Activity.is_patient_id && transaction_patients.length <= 0 && is_vaccine === 1)
        throw Error(req.__('validator.patient_id_not_empty', {
          field: req.__('field.transaction.patient_id'), activity: Activity.name
        }))

    }
  }

  return true
}

async function getTransactionBySequence(patient_id, vaccine_sequence) {
  let dataTransaction = null

  /* get transaction patient data due new form of vaccine sequence/patient id on transaction */
  const transactionPatient = await models.TransactionPatient.findOne({
    include: [
      {
        association: 'transaction',
        include: [
          {
            association: 'entity', attributes: ['id', 'name'],
            include: [
              { association: 'province', attributes: ['id', 'name'] },
              { association: 'regency', attributes: ['id', 'name'] },
              { association: 'sub_district', attributes: ['id', 'name'] }
            ]
          },
          { association: 'master_material', attributes: ['id', 'name'] }
        ]
      }
    ],
    where: { patient_id, vaccine_sequence },
  })

  if (transactionPatient) dataTransaction = transactionPatient?.transaction
  else {
    /* if transaction patient not available then get data from transaction (old format)*/
    dataTransaction = await models.Transaction.findOne({
      include: [
        {
          association: 'entity', attributes: ['id', 'name'],
          include: [
            { association: 'province', attributes: ['id', 'name'] },
            { association: 'regency', attributes: ['id', 'name'] },
            { association: 'sub_district', attributes: ['id', 'name'] }
          ]
        },
        { association: 'master_material', attributes: ['id', 'name'] }
      ],
      where: { patient_id, vaccine_sequence },
      order: [['createdAt', 'DESC']]
    })
  }

  return dataTransaction
}

async function checkVAROptimized(value, patient, req) {
  const varName = (sequence) => {
    return req.__(`rabies_vaccine.${sequence}`)
  }

  let vaccineRules = await models.RabiesVaccineRule.findAll()
  vaccineRules = _.groupBy(vaccineRules, 'sequence')

  let { transaction_date, vaccine_sequence, patient_id } = value
  let { last_vaccine_at, preexposure_sequence } = patient

  last_vaccine_at = last_vaccine_at ?? transaction_date

  let currentSequence = patient?.vaccine_sequence ?? preexposure_sequence
  let nextSequence = vaccine_sequence

  let dataTransaction = await getTransactionBySequence(patient?.id, currentSequence)

  let date = dataTransaction?.actual_transaction_date ?? dataTransaction?.createdAt

  let entityName = dataTransaction?.entity?.name || ''
  if (dataTransaction?.entity?.province) entityName += ', ' + dataTransaction?.entity?.province?.name
  if (dataTransaction?.entity?.regency) entityName += ', ' + dataTransaction?.entity?.regency?.name
  if (dataTransaction?.entity?.sub_district) entityName += ', ' + dataTransaction?.entity?.sub_district?.name

  if (dataTransaction && dataTransaction?.transaction_type_id === TRANSACTION_TYPE.ISSUES && (nextSequence === patient?.vaccine_sequence || nextSequence === patient?.preexposure_sequence)) {
    throw Error(req.__('validator.vaccine_rabies_exist', {
      nik: patient_id, vaccine_sequence: varName(nextSequence),
      entity: entityName, date: moment(date).format('YYYY-MM-DD'),
      material: dataTransaction?.master_material?.name
    }))
  }

  const Date1 = moment(moment(transaction_date).format('YYYY-MM-DD'))
  const Date2 = moment(moment(last_vaccine_at).format('YYYY-MM-DD'))

  let days = Date1.diff(Date2, 'days')

  const matrixRule = MATRIX_RULE_RABIES[currentSequence][nextSequence] ?? {}
  const rabiesRule = vaccineRules[currentSequence ?? 1][0]

  if (matrixRule?.can) {
    if (rabiesRule.active_duration && days > rabiesRule.active_duration && !matrixRule?.ignore_exp) {
      throw Error(req.__(`validator.var${currentSequence}_expired`))
    } else if (rabiesRule.active_duration && days < rabiesRule.active_duration && matrixRule?.gt_exp) {
      throw Error(req.__('validator.vaccine_sequence_not_match', {
        nik: patient_id, vaccine_sequence: varName(nextSequence),
        entity: entityName, date: moment(date).format('YYYY-MM-DD'),
        material: dataTransaction?.master_material?.name, next_sequence: varName(currentSequence + 1)
      }))
    } else if (matrixRule?.other_sequences) {
      const dataSequence = []

      for (let val of matrixRule?.other_sequences)
        dataSequence.push({
          sequence: val,
          date: null
        })
      throw {
        message: req.__('validator.vaccine_sequence_not_match_confirm', {
          vaccine_sequence: varName(matrixRule?.other_sequences[0]), nik: patient_id, input_sequence: varName(nextSequence)
        }),
        need_confirm: 1,
        data: dataSequence
      }
    }
  } else {
    if (currentSequence === 5 || currentSequence == 7) {
      throw Error(req.__('validator.vaccine_rabies_exist', {
        nik: patient_id, vaccine_sequence: varName(vaccine_sequence),
        entity: entityName, date: moment(date).format('YYYY-MM-DD'),
        material: dataTransaction?.master_material?.name
      }))
    } else if (nextSequence >= 6 && nextSequence <= 7 && currentSequence < 6) {
      throw Error(req.__('validator.forbidden_sequence', { vaccine_sequence: varName(vaccine_sequence) }))
    } else {
      throw Error(req.__('validator.vaccine_sequence_not_match', {
        nik: patient_id, vaccine_sequence: varName(nextSequence),
        entity: entityName, date: moment(date).format('YYYY-MM-DD'),
        material: dataTransaction?.master_material?.name, next_sequence: varName(currentSequence + 1)
      }))
    }
  }
}

async function patientValidates(value, { req }) {
  const varName = (sequence) => {
    return req.__(`rabies_vaccine.${sequence}`)
  }

  let vaccineRules = await models.RabiesVaccineRule.findAll()
  vaccineRules = _.groupBy(vaccineRules, 'sequence')

  let { transaction_type_id, vaccine_sequence, patient_id, other_sequences = [], masterMaterial } = value

  const nik = doEncrypt(patient_id ?? '')
  const patient = await models.Patient.findOne({ where: { nik } })

  if (transaction_type_id == TRANSACTION_TYPE.ISSUES) {

    let dataSequence = []
    if ((!patient?.vaccine_sequence && !patient?.preexposure_sequence) 
        && (vaccine_sequence > 1 && vaccine_sequence < 6) && other_sequences.length <= 0) {
      dataSequence = []
      let nextTop = vaccine_sequence < 6 ? vaccine_sequence : 7
      for (let i = 1; i < nextTop; i++) {
        dataSequence.push({
          sequence: i,
          date: null
        })
      }
      throw {
        message: req.__('validator.new_vaccine_not_match', {
          vaccine_sequence: varName(1),
          input_sequence: varName(vaccine_sequence)
        }),
        need_confirm: 1,
        data: dataSequence
      }
    } else if ((!patient?.vaccine_sequence && !patient?.preexposure_sequence) 
      && vaccine_sequence == 7 && other_sequences.length <= 0) {
      throw {
        message: req.__('validator.new_vaccine_not_match', {
          vaccine_sequence: varName(6),
          input_sequence: varName(vaccine_sequence)
        }),
        need_confirm: 1,
        data: [{ sequence: 6, date: null }]
      }
    }

    if (vaccine_sequence && !masterMaterial.need_sequence)
      throw Error(req.__('validator.no_need_sequence'))

    if(!vaccine_sequence && masterMaterial.need_sequence)
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.transaction.vaccine_sequence')
      }))

    if ((patient?.vaccine_sequence || patient?.preexposure_sequence) 
      && other_sequences.length <= 0 && masterMaterial.need_sequence) 
      await checkVAROptimized(value, patient, req)

  } else if (transaction_type_id == TRANSACTION_TYPE.RETURN) {
    /* check VAR I - Booster II */
    if (!patient?.vaccine_sequence && !patient?.preexposure_sequence) {
      throw Error(req.__('validator.vaccine_return_not_exist', {
        nik: patient_id
      }))
    }else if (vaccine_sequence >= 1 && vaccine_sequence <= 5) {
      if (vaccine_sequence != patient?.vaccine_sequence) {
        throw Error(req.__('validator.vaccine_sequence_return', {
          nik: patient_id, vaccine_sequence: varName(patient.vaccine_sequence ?? patient.preexposure_sequence)
        }))
      }
    } else if (vaccine_sequence >= 6 && vaccine_sequence <= 7) {
      /* check Pre-exposure I & II */
      if (vaccine_sequence != patient?.preexposure_sequence) {
        throw Error(req.__('validator.vaccine_sequence_return', {
          nik: patient_id, vaccine_sequence: varName(patient.preexposure_sequence ?? patient.vaccine_sequence)
        }))
      }
    }
  }
}


export async function interceptTransactionValue(req, res, next) {
  if (!isArray(req.body)) return next()
  for (let item of req.body) {
    const {material_id} = item
    if (isArray(item.transaction_patients)) {
      const masterMaterial = await models.MasterMaterial.findByPk(material_id)
      item.is_vaccine = masterMaterial?.is_vaccine
      for (let itm of item.transaction_patients) {
        itm.transaction_type_id = item.transaction_type_id
        itm.transaction_date = item.actual_transaction_date || moment().format('YYYY-MM-DD HH:mm:ss')
        itm.material_id = item.material_id
        itm.masterMaterial = {need_sequence: masterMaterial?.need_sequence, is_vaccine: masterMaterial?.is_vaccine}
      }
    }
  }

  next()
}

async function checkPatientReturn(value, { req }) {
  const { transaction_patients = [], transaction_type_id } = value
  if (transaction_type_id === TRANSACTION_TYPE.RETURN && transaction_patients.length > 1) {
    const patientNiks = []

    for (let item of transaction_patients)
      patientNiks.push(doEncrypt(item.patient_id))

    const patients = await models.Patient.findAll({ where: { nik: patientNiks } })
    const patientIds = _.keys(_.groupBy(patients, 'id'))

    const transactionPatients = await models.TransactionPatient.findAll({
      where : {patient_id: patientIds},
      limit: patientIds.length,
      order: [['id', 'DESC']]
    })

    const transactionIds = _.keys(_.groupBy(transactionPatients, 'transaction_id'))

    if(transactionIds.length>1)
      throw Error('Daftar patient ini tidak sama dengan daftar patient saat pengeluaran')
  }

}