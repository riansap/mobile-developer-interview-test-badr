import { body, param } from 'express-validator'
import { ENTITY_TYPE, USER_ROLE } from '../helpers/constants'
import models from '../models'
import {
  commonNotExistsId,
  commonNotActiveId,
  constantNotExist,
  commonExistsField,
  commonExistsFieldUpdate,
} from './customValidator'
import { updateStatus } from './generalValidator'

export const general = [
  body('name')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.name')
    }))
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.material.name')
    })),
  body('code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.code')
    }))
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.material.code')
    })),
  body('description')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.description')
    })),
  body('pieces_per_unit')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.pieces_per_unit')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.pieces_per_unit')
    })),
  body('unit')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.unit')
    })),
  body('temperature_sensitive')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.temperature_sensitive')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.temperature_sensitive')
    })),
  body('temperature_min')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.temperature_min')
    })),
  body('managed_in_batch')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.managed_in_batch')
    }))
    .isInt({min: 0, max: 1})
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.managed_in_batch')
    })),
  body('temperature_max')
    .optional({nullable: true})
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.temperature_max')
    })),
  body('material_companion')
    .if(body('material_companion').exists())
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_tags')
    })),
  body('material_companion.*')
    .custom(commonNotActiveId('Material', 'id.material_companion_id')),
  body('material_tags')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.material_tags')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.material.material_tags')
    }))
    .custom((value, { req }) => {
      if (value.length > 1) throw new Error(req.__('custom.material_tag_only_one'))
      return true
    }),
  body('material_tags.*')
    .isInt({gt: 0})
    .custom(commonNotExistsId('MaterialTag', 'id.material_tag_id')),
  body('manufactures')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.manufactures')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.material.manufactures')
    })),
  body('manufactures.*')
    .custom(commonNotActiveId('Manufacture', 'id.manufacture_id')),
  body('is_stockcount')
    .custom(materialConditionCheck('stockcount')),
  body('is_addremove')
    .custom(materialConditionCheck('addremove')),
  body('entity_types')
    .if(body('entity_types').exists())
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.id.entity_type_id')
    })),
  body('entity_types.*')
    .custom(constantNotExist(ENTITY_TYPE, 'field.entity.type')),
  body('roles')
    .if(body('roles').exists())
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.id.role_id')
    })),
  body('roles.*')
    .custom(constantNotExist(USER_ROLE, 'field.user.role')),
]

export const create = [
  body('code')
    .custom(commonExistsField('Material', 'code', 'material.code')),
  ...general,
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.id')
    })),
  body('code')
    .custom(commonExistsFieldUpdate('Material', 'code', 'material.code')),
  ...general,
]

export const updateMaterialStatus = [
  ...updateStatus,
  param('id')
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.id')
    }))
    .custom(materialStatusValidate)
]

async function materialStatusValidate(value, { req }) {
  if(value) {
    const checkActiveStock = await models.Stock.sum('qty', {
      group: ['material_entity_id'],
      include: [
        {
          association: 'material_entity',
          where: {
            material_id: value,
          },
          required: true,
          attributes: []
        },
        {
          model: models.Batch.scope('not_expired'),
          as: 'batch',
          required: false,
          attributes: []
        }
      ]
    })
    const checkActiveOrder = await models.Order.scope('active').count({
      include: {
        association: 'order_items',
        where: {
          material_id: value
        }
      }
    })
    if(checkActiveStock || checkActiveOrder) {
      throw Error(
        req.__('custom.material_status_has_stock')
      )
    }
  }
  return true
}

export function materialConditionCheck(type = '') {
  return async function(value, { req }) {
    if(value) {
      const { entity_types, roles } = req.body[type]
      let error = false
      if(!entity_types && !roles) {
        error = true
      }
      if(entity_types.length <= 0 && roles.length <= 0) {
        error = true
      }
      if(error) {
        throw Error(
          req.__('custom.is_stock_count_error')
        )
      }
    }
    return true
  }
}
