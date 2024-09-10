import { body, param } from 'express-validator'
import models from '../models'
import {
  commonNotExistsId
} from './customValidator'
import { Op } from 'sequelize'

const general = [
  body('master_material_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.material_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.material_id')
    }))
    .custom(commonNotExistsId('MasterMaterial', 'id.material_id')),
  body('manufacture_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.manufacture_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.manufacture_id')
    }))
    .custom(commonNotExistsId('Manufacture', 'id.manufacture_id'))
    .custom(checkMaterialManufacture()),
  body('pieces_per_unit')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.volume_material_manufacture.pieces_per_unit')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.volume_material_manufacture.pieces_per_unit')
    })),
  body('unit_per_box')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.volume_material_manufacture.unit_per_box')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.volume_material_manufacture.unit_per_box')
    })),
  body('box_length')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.volume_material_manufacture.box_length')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.volume_material_manufacture.box_length')
    })),
  body('box_width')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.volume_material_manufacture.box_width')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.volume_material_manufacture.box_width')
    })),
  body('box_height')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.volume_material_manufacture.box_height')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.volume_material_manufacture.box_height')
    }))

]

function checkMaterialManufacture() {
  return async function (value, { req }) {
    const { master_material_id } = req.body
    if (value && master_material_id) {
      let condition = { master_material_id, manufacture_id: value }
      if (req.params.id)
        condition.id = { [Op.ne]: req.params.id }
      const volumeMaterial = await models.MasterVolumeMaterialManufacture.findOne({
        where: condition
      })
      if (volumeMaterial) throw Error(req.__('validator.exist2', { field1: req.__(`field.id.material_id`), field2: req.__(`field.id.manufacture_id`) }))
    }
    return true
  }
}

export const detail = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.volume_material_manufacture.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.volume_material_manufacture.id')
    }))
]

export const create = [
  ...general
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.volume_material_manufacture.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.volume_material_manufacture.id')
    })),
  ...general
]