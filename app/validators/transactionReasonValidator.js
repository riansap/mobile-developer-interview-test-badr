import { body, param } from 'express-validator'
import { commonNotExistsId } from './customValidator'

export const create = [
  body('title')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.transaction_reason.title')
    })),
  body('transaction_type_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.transaction_type_id')
    }))
    .custom(commonNotExistsId('TransactionType', 'id.transaction_type_id'))
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.transaction_reason.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.transaction_reason.id')
    })),
  ...create
]