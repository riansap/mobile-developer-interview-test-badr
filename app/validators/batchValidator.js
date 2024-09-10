import { body, param } from 'express-validator'
import { commonExistsField, commonExistsFieldUpdate } from './customValidator'

const general = [
  body('code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.batch.code') })),
  body('expired_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.batch.expired_date') }))
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', { field: req.__('field.batch.expired_date') })),
  body('production_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.batch.production_date') }))
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', { field: req.__('field.batch.production_date') })),
]

export const create = [
  body('code')
    .custom(commonExistsField('Batch', 'code', 'batch.code')),
  ...general
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.batch.code') }))
    .isNumeric().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.batch.id') })),
  body('code')
    .custom(commonExistsFieldUpdate('Batch', 'code', 'batch.code')),
  ...general
]