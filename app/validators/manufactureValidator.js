import { body, param } from 'express-validator'
// import { USER_ROLE, USER_GENDER } from '../helpers/constants'
import {
  commonNotExistsId,
  commonExistsField,
  commonExistsFieldUpdate,
  checkIsOnlySpace,
} from './customValidator'

const general = [
  body('name')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.manufacture.name')
    }))
    .custom(checkIsOnlySpace('field.manufacture.name')),
  body('reference_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.manufacture.reference_id')
    }))
    .custom(checkIsOnlySpace('field.manufacture.reference_id')),
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage((value, { req }) => req.__('validator.email', {
      field: req.__('field.manufacture.email')
    })),
  // .custom(constantNotExist(USER_GENDER, 'field.user.gender')),
  body('village_id')
    .optional({ nullable: true })
    .custom(commonNotExistsId('Village', 'id.village_id')),
  body('phone_number')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.manufacture.phone_number')
    }))
]

export const create = [
  body('name')
    .custom(commonExistsField('Manufacture', 'name', 'manufacture.name')),
  body('reference_id')
    .custom(commonExistsField('Manufacture', 'reference_id', 'manufacture.reference_id')),
  ...general
]

export const update = [
  param('id')
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.manufacture.id')
    })),
  body('name')
    .custom(commonExistsFieldUpdate('Manufacture', 'name', 'manufacture.name')),
  body('reference_id')
    .custom(commonExistsFieldUpdate('Manufacture', 'reference_id', 'manufacture.reference_id')),
  ...general
]