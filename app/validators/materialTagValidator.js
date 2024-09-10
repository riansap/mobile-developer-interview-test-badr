import { body, param } from 'express-validator'
import { commonExistsField, commonExistsFieldUpdate } from './customValidator'

const general = [
  body('title')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.material_tag.title') }))
]

export const create = [
  body('title')
    .custom(commonExistsField('MaterialTag', 'title', 'material_tag.title')),
  ...general
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.material_tag.id') }))
    .isNumeric().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.material_tag.id') })),
  body('title')
    .custom(commonExistsFieldUpdate('MaterialTag', 'title', 'material_tag.title')),
  ...general
]