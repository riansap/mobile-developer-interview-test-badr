import { body, param } from 'express-validator'
import { USER_ROLE } from '../../helpers/constants'
import models from '../../models'
import { commonNotActiveId, commonNotExistsId, checkDateTime } from '../customValidator'
import { entityActivityDateValidator } from './entityActivityDateValidator'

export const create = [
  body('material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.id')
    }))
    .custom(commonNotActiveId('MasterMaterial', 'id.material_id')),
  body('entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.id')
    }))
    .custom(commonNotActiveId('Entity', 'id.entity_id'))
    .custom(validateEntityOpname),
  body('activity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.activity_id')
    }))
    .custom(commonNotExistsId('MasterActivity', 'id.activity_id')),
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
  body('reconciliation_items.*')
    .custom(validateRekonItem),
  body()
    .custom((value, { req }) => {
      const { entity_id, activity_id } = req.body

      return entityActivityDateValidator(entity_id, activity_id, req)
    })
]

function arrayOfObjHasDuplicate(arrays, key) {
  let isDuplicate = false
  for (let i = 0; i < arrays.length; i++) {
    let item = arrays[i]
    let hasDuplicate = arrays.filter(e => e[key] === item[key]).length
    if (hasDuplicate > 1) {
      isDuplicate = true
      return isDuplicate
    }
  }
  // arrays.forEach((item) => {

  // })
  return isDuplicate
}

function validateReasonAction(reasons, actions) {
  // 
  let hasSameAction = false
  for (let i = 0; i < reasons.length; i++) {
    let reasonId = reasons[i].id
    let actionId = actions[i].id
    for (let j = 0; j < actions.length; j++) {
      if (j !== i && reasonId === reasons[j].id && actionId === actions[j].id) {
        hasSameAction = true
        break
      }
    }
  }
  return hasSameAction
}

// reasons[0].id actions[0].id !== reasons[1].id actions[1].id
async function validateRekonItem(value, { req }) {
  let { real_qty, smile_qty, reasons, actions } = value
  if (parseInt(real_qty) !== parseInt(smile_qty)) {
    if (!reasons.length || !actions.length) {
      throw Error(req.__('validator.not_exist', { field: 'Reason & Action' }))
    }
    // check duplicate reason & action cannot same
    if (validateReasonAction(reasons, actions)) {
      throw Error(req.__('validator.duplicated', { field: 'Reason Action' }))
    }
  }
  if (reasons.length !== actions.length) {
    throw Error(req.__('validator.string', { field: 'Reason & Action' }))
  }

  return true
}

async function validateEntityOpname(value, { req }) {
  // let { real_qty, smile_qty, reasons, actions } = value
  const { user } = req
  if (user.role === USER_ROLE.SUPERADMIN) {
    const isVendor = await models.Entity.count({
      where: [{ id: value }, { is_vendor: 1 }]
    })
    if (!isVendor) throw Error('Entity must be a vendor')
  } else {
    if (parseInt(value) !== parseInt(user.entity_id)) throw Error('Entity must be same with user entity')
  }

  return true
}