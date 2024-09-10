import { body, param } from 'express-validator'
import { USER_ROLE, USER_GENDER, validateMobilePhone } from '../helpers/constants'
import {
  commonNotExistsId,
  checkPassword,
  constantNotExist,
  commonExistsField,
  commonExistsFieldUpdate,
  commonInvalidValue,
} from './customValidator'

import { updateStatus } from '../validators/generalValidator'

const general = [
  body('username')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.user.username')
    })),
  body('firstname')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.user.firstname')
    })),
  body('email')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.user.email')
    }))
    .isEmail()
    .withMessage((value, { req }) => req.__('validator.email', {
      field: req.__('field.user.email')
    })),
  body('role')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.role')
    }))
    .custom(constantNotExist(USER_ROLE, 'field.user.role')),
  body('gender')
    .custom(constantNotExist(USER_GENDER, 'field.user.gender')),
  body('entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.entity_id')
    }))
    .custom(commonNotExistsId('Entity', 'id.entity_id')),
  body('manufacture_id')
    .if((value, { req }) => parseInt(req.body.role) === USER_ROLE.VENDOR_IOT)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.manufacture_id')
    }))
    .custom(commonNotExistsId('Manufacture', 'id.manufacture_id')),
  body('village_id')
    .custom(commonNotExistsId('Village', 'id.village_id')),
  body('timezone_id')
    .custom(commonNotExistsId('Timezone', 'id.timezone_id')),
  body('mobile_phone')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.user.mobile_phone')
    }))
    .isLength({ min: 10, max: 14 })
    .withMessage((value, { req }) => req.__('custom.phone_length'))
    .custom(function (value, { req }) {
      if (value) {
        if (!validateMobilePhone(value)) {
          throw Error(req.__('custom.phone_start_digits'))
        }
      }
      return true
    }),
  body('date_of_birth')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.user.date_of_birth')
    })),
  body('view_only')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('view_only')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('view_only')
    }))
    .custom(commonInvalidValue([0, 1], 'view_only'))
]

export const create = [
  body('username')
    .custom(commonExistsField('User', 'username', 'user.username')),
  body('email')
    .custom(commonExistsField('User', 'email', 'user.email')),
  body('password')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.user.password') }))
    .custom(checkPassword),
  ...general
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.user.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.user.id')
    })),
  body('username')
    .custom(commonExistsFieldUpdate('User', 'username', 'user.username')),
  body('email')
    .custom(commonExistsFieldUpdate('User', 'email', 'user.email')),
  ...general
]

export const updateUserStatus = [
  ...updateStatus,
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.user.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.user.id')
    }))
    .custom(userStatusValidate)
]

async function userStatusValidate(value, { req }) {
  if (req.body.status == 0)
    req.body = {
      status: req.body.status,
      token_login: null
    }
  return true
}