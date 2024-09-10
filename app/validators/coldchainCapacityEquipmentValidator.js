import { body, param } from 'express-validator'
import { commonExistsField, commonExistsFieldUpdate, commonNotExistsId } from './customValidator'

export const defaultID = [
  param('id')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.coldchain_capacity_equipment.id') }))
    .isNumeric().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.coldchain_capacity_equipment.id') }))
    .custom(commonNotExistsId('ColdchainCapacityEquipmentIot', 'coldchain_capacity_equipment.id')),
]

const defaultBody = [
  body().custom((value, { req }) => {
    if (typeof value !== 'object' || value === null) {
      throw new Error(req.__('validator.invalid_object'))
    }

    const { capacity_nett_at_plus_5_c, capacity_nett_at_minus_20_c, capacity_nett_at_minus_86_c } = value
    if (!capacity_nett_at_plus_5_c && !capacity_nett_at_minus_20_c && !capacity_nett_at_minus_86_c) {
      throw new Error(req.__('field.coldchain_capacity_equipment.at_least_one_property'))
    }

    return true
  }).withMessage((value, { req }) => req.__('field.coldchain_capacity_equipment.at_least_one_property')),
  body('capacity_nett_at_plus_5_c')
    .optional({ nullable: true })
    .isFloat().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.coldchain_capacity_equipment.capacity_nett_at_plus_5_c') })),
  body('capacity_nett_at_minus_20_c')
    .optional({ nullable: true })
    .isFloat().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.coldchain_capacity_equipment.capacity_nett_at_minus_20_c') })),
  body('capacity_nett_at_minus_86_c')
    .optional({ nullable: true })
    .isFloat().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.coldchain_capacity_equipment.capacity_nett_at_minus_86_c') })),
]

export const createValidator = [
  body('code_pqs')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.coldchain_capacity_equipment.code_pqs') }))
    .isString().withMessage((value, { req }) => req.__('validator.string', { field: req.__('field.coldchain_capacity_equipment.code_pqs') }))
    .custom(commonExistsField('ColdchainCapacityEquipmentIot', 'code_pqs', 'coldchain_capacity_equipment.code_pqs')),
  ...defaultBody
]
export const updateValidator = [
  body('code_pqs')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.coldchain_capacity_equipment.code_pqs') }))
    .isString().withMessage((value, { req }) => req.__('validator.string', { field: req.__('field.coldchain_capacity_equipment.code_pqs') }))
    .custom(commonExistsFieldUpdate('ColdchainCapacityEquipmentIot', 'code_pqs', 'coldchain_capacity_equipment.code_pqs')),
  ...defaultID,
  ...defaultBody
]