import { body, param } from 'express-validator'
import { commonNotExistsId } from './customValidator'
import models from '../models'
import { Op } from 'sequelize'

export const general = [
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
    .custom(commonNotExistsId('Entity', 'id.entity_id')),
  body('consumption_rate')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.consumption_rate')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.consumption_rate')
    })),
  body('retailer_price')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.retailer_price')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.retailer_price')
    })),
  body('tax')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.tax')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.tax')
    })),
  body('min')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.min')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.min')
    })),
  body('max')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.max')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.max')
    }))
]

export const create = [
  ...general,
  body('')
    .custom(materialEntityExists)
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.id')
    })),
  ...general
]

export async function materialEntityExists(value, { req }) {
  if (value) {
    const {material_id, entity_id} = req.body
    const materialEntity = await models.MaterialEntity.findOne(
      { where: [
        { material_id: material_id },
        { entity_id: entity_id }
      ]}
    )
    if (materialEntity) {
      throw Error(req.__('validator.exist', { field: 'material_id' }) + ' & ' + req.__('validator.exist', { field: 'entity_id' }))
    }
  }
  return true
}

export const destroy = [
  param('id')
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.id')
    }))
    .custom(checkActiveOrder)
]

async function checkActiveOrder(value, { req }) {
  if(value) {
    const materialEntity = await models.MaterialEntity.findByPk(value)
    if(!materialEntity) throw Error(req.__('404'))

    const countActiveOrder = await models.Order.scope('active').count({
      where: {
        [Op.or]: [
          { customer_id: materialEntity.entity_id },
          { vendor_id: materialEntity.entity_id }
        ]
      },
      include: {
        association: 'order_items',
        where: {
          material_id: materialEntity.material_id
        }
      }
    })
    if(countActiveOrder) {
      throw Error(
        'Tidak bisa menghapus data, data memiliki pesanan aktif'
      )
    }
  }
  return true
}