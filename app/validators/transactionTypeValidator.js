import { body, param } from 'express-validator'

export const create = [
  body('title')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.transaction_type.title')
    }))
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.transaction_type.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.transaction_type.id')
    })),
  ...create
]