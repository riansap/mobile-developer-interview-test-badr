/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { body, param } from 'express-validator'
import models from '../models'
import { commonNotActiveId } from './customValidator'
import { isMultipleValue } from '../helpers/common'

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
  const material = await models.Material.findByPk(material_id)
  const { pieces_per_unit, managed_in_batch } = material
  for (const stock of new_opname_stocks) {
    const {
      stock_id, batch_id, batch_code, expired_date
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
        const checkStock = await models.Stock.count({ where: [{ id: stock_id }, { batch_id }] })
        if (!checkBatch) throw Error(req.__('validator.not_exist', { field: req.__('field.id.batch_id') }))
        if (!checkStock) throw Error(req.__('validator.not_exist', { field: req.__('field.id.stock_id') }))
      }
    }
  } 

  return true
}

export const create = [
  body('entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.id'),
    }))
    .custom(commonNotActiveId('Entity', 'id.entity_id')),
  body('new_opname_items.*.material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.id'),
    }))
    .custom(commonNotActiveId('Material', 'id.material_id')),
  body('new_opname_items.*')
    .custom(validateNewOpnameStock),
]
