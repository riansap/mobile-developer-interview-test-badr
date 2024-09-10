import { body, param } from 'express-validator'
import { USER_ROLE } from '../helpers/constants'
import models from '../models'
import { commonNotActiveId, checkDateTime } from './customValidator'

export const create = [
  body('material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.id')
    }))
    .custom(commonNotActiveId('Material', 'id.material_id')),
  body('entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.id')
    }))
    .custom(commonNotActiveId('Entity', 'id.entity_id'))
    .custom(validateEntityOpname),
  body('start_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Start date'
    }))
    .custom(checkDateTime('start_date', 'YYYY-MM-DD')),
  body('end_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'End date'
    }))
    .custom(checkDateTime('start_date', 'YYYY-MM-DD')),
  body('opname_stock_items.*')
    .custom(validateOpnameStockItem)
]

async function validateOpnameStockItem(value, { req }) {
  let { real_qty, smile_qty, reasons, actions } = value
  if(parseInt(real_qty) !== parseInt(smile_qty)) {
    if(!reasons.length || !actions.length) {
      throw Error(req.__('validator.not_exist', { field: 'Reason & Action must be filled' }))
    }
  }
  if(reasons.length !== actions.length) {
    throw Error(req.__('validator.not_exist', { field: 'Reason & Action must be equals value' }))
  }

  return true
}

async function validateEntityOpname(value, { req }) {
  // let { real_qty, smile_qty, reasons, actions } = value
  const { user } = req
  if(user.role === USER_ROLE.SUPERADMIN) {
    const isVendor = await models.Entity.count({
      where: [{ id: value }, { is_vendor: 1 }]
    })
    if(!isVendor) throw Error('Entity must be a vendor')
  } else {
    if(parseInt(value) !== parseInt(user.entity_id)) throw Error('Entity must be same with user entity')
  }

  return true
}