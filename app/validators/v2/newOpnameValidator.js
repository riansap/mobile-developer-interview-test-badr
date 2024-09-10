/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { body } from 'express-validator'
import models from '../../models'
import { commonNotActiveId, commonNotExistsId } from '../customValidator'
import { isMultipleValue } from '../../helpers/common'
import { entityActivityDateValidator } from './entityActivityDateValidator'

function checkStockQty(stock, pieces_per_unit) {
  const {
    real_qty,
    unsubmit_distribution_qty,
    unsubmit_return_qty,
  } = stock

  let isNotPiecePerUnit = false
  let field = ''
  let isMinus = false

  if (real_qty < 0) isMinus = true
  if (unsubmit_distribution_qty < 0) isMinus = true
  if (unsubmit_return_qty < 0) isMinus = true

  if (!isMultipleValue(real_qty, pieces_per_unit)) {
    field = 'real_qty'
    isNotPiecePerUnit = true
  }
  if (!isMultipleValue(unsubmit_distribution_qty, pieces_per_unit)) {
    field = 'unsubmit_distribution_qty'
    isNotPiecePerUnit = true
  }
  if (!isMultipleValue(unsubmit_return_qty, pieces_per_unit)) {
    field = 'unsubmit_return_qty'
    isNotPiecePerUnit = true
  }

  return { isNotPiecePerUnit, field, isMinus }
}

async function validateNewOpnameStock(value, { req }) {
  const {
    material_id, new_opname_stocks,
  } = value
  const material = await models.MasterMaterial.findByPk(material_id)
  if (!material) throw Error(req.__('validator.not_exist', { field: 'Material' }))
  const { pieces_per_unit, managed_in_batch } = material
  for (const stock of new_opname_stocks) {
    const {
      stock_id, batch_id, batch_code, expired_date, smile_qty
    } = stock
    const { isNotPiecePerUnit, field, isMinus } = checkStockQty(stock, pieces_per_unit)
    if (isNotPiecePerUnit) {
      throw Error(req.__('custom.opname_not_pieces_unit', { field }))
    }
    if (isMinus) {
      const field1 = 'return_qty,unsubmit_distribution_qty,unsubmit_return_qty'
      throw Error(req.__('validator.greater_than', { field1, field2: '0' }))
    }
    if (managed_in_batch) {
      if (!batch_id) {
        if (!batch_code) throw Error(req.__('validator.required', { field: req.__('field.batch.code') }))
        if (!expired_date) throw Error(req.__('validator.required', { field: req.__('field.batch.expired_date') }))
      } else {
        const checkBatch = await models.Batch.count({ where: { id: batch_id } })
        //const checkStock = await models.Stock.count({ where: [{ id: stock_id }, { batch_id }] })
        if (!checkBatch) throw Error(req.__('validator.not_exist', { field: req.__('field.id.batch_id') }))
        //if (!checkStock) throw Error(req.__('validator.not_exist', { field: req.__('field.id.stock_id') }))
      }
    }
  }

  return true
}

export const create = [
  body('data')
    .isArray()
    .withMessage((value, {req})=> req.__('validator.array', {
      field: 'Data opname'
    })),
  body('data.*.entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.id'),
    }))
    .custom(commonNotActiveId('Entity', 'id.entity_id')),
  body('data.*.activity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.activity_id'),
    }))
    .custom(commonNotExistsId('MasterActivity', 'id.activity')),
  body('data.*.new_opname_items.*.material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.id'),
    }))
    .custom(commonNotActiveId('MasterMaterial', 'id.material_id')),
  body('data.*.new_opname_items.*.new_opname_stocks.*.smile_qty')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.new_opnames.smile_qty'),
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.new_opnames.smile_qty')
    })),
  body('data.*.new_opname_items.*.new_opname_stocks.*.real_qty')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.new_opnames.real_qty'),
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.new_opnames.real_qty')
    })),
  body('data.*.new_opname_items.*')
    .custom(validateNewOpnameStock),
  body('data.*.period_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.opname_period.id'),
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.opname_period.id')
    }))
    .custom(commonNotExistsId('OpnamePeriod', 'opname_period.id')),
  body('data.*')
    .custom((value, { req }) => {
      const { entity_id, activity_id } = value

      return entityActivityDateValidator(entity_id, activity_id, req)
    })
]
