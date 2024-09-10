import { body, param } from 'express-validator'
import { commonNotExistsId } from './customValidator'

export const create = [
  body('material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .custom(commonNotExistsId('Material', 'id.material_id')),
  body('entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.entity_id')
    }))
    .custom(commonNotExistsId('Entity', 'id.entity_id'))
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.stock.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.stock.id')
    })),
  ...create,
]