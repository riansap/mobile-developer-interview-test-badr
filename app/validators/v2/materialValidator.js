import { body, param } from 'express-validator'
import { ENTITY_TYPE, KFA_LEVEL_ID, USER_ROLE } from '../../helpers/constants'
import models from '../../models'
import {
  commonNotExistsId,
  commonNotActiveId,
  constantNotExist,
  commonExistsField,
  commonExistsFieldUpdate,
  duplicateArrayValidator
} from '../customValidator'
import { updateStatus } from '../generalValidator'
import { materialConditionCheck } from '../materialValidator'

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
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.temperature_min')
    })),
  body('managed_in_batch')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material.managed_in_batch')
    }))
    .isInt({ min: 0, max: 1 })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.managed_in_batch')
    })),
  body('temperature_max')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.temperature_max')
    })),
  body('material_companion')
    .if(body('material_companion').exists())
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.order.order_tags')
    }))
    .custom(duplicateArrayValidator('material_companion_id')),
  body('material_companion.*')
    .custom(commonNotActiveId('MasterMaterial', 'id.material_companion_id')),
  body('activities')
    .custom(duplicateArrayValidator('activity_id'))
    .custom(checkActivitiesIfKfa),
  body('activities.*')
    .isInt({ gt: 0 })
    .custom(commonNotExistsId('MasterActivity', 'id.activity_id')),
  body('manufactures')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.manufacture_id')
    }))
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.id.manufacture_id')
    }))
    .custom(duplicateArrayValidator('manufacture_id')),
  body('manufactures.*')
    .custom(commonNotActiveId('Manufacture', 'id.manufacture_id')),
  // body('is_stockcount')
  //   .custom(materialConditionCheck('stockcount')),
  body('is_addremove')
    .custom(materialConditionCheck('addremove')),
  body('entity_types')
    .if(body('entity_types').exists())
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.id.entity_type_id')
    }))
    .custom(duplicateArrayValidator('entity_type_id')),
  body('entity_types.*')
    .custom(constantNotExist(ENTITY_TYPE, 'field.entity.type')),
  body('roles')
    .if(body('roles').exists())
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.id.role_id')
    }))
    .custom(duplicateArrayValidator('role_id')),
  body('roles.*')
    .custom(constantNotExist(USER_ROLE, 'field.user.role')),
  body('kfa')
    .custom(checkKfaLevelHierarchy)
]

export const create = [
  body('name')
    .custom(commonExistsField('MasterMaterial', 'name', 'material.name')),
  body('code')
    .custom(commonExistsField('MasterMaterial', 'code', 'material.code')),
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
  body('name')
    .custom(commonExistsFieldUpdate('MasterMaterial', 'name', 'material.name')),
  body('code')
    .custom(commonExistsFieldUpdate('MasterMaterial', 'code', 'material.code')),
  ...general,
]

export const updateMaterialStatus = [
  ...updateStatus,
  param('id')
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.id')
    }))
    .custom(masterMaterialStatusValidate)
]

async function masterMaterialStatusValidate(value, { req }) {
  const { kfa } = req.body

  if (value && !kfa) {
    const checkActiveStock = await models.Stock.sum('qty', {
      group: ['entity_has_material_id'],
      include: [
        {
          association: 'entity_master_material',
          where: {
            master_material_id: value,
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
          master_material_id: value
        }
      }
    })
    const checkTransaction = await models.Transaction.count({
      where: {
        master_material_id: value
      },
    })

    if (checkActiveStock || checkActiveOrder) {
      throw Error(req.__('custom.material_status_has_stock'))
    } else if (checkTransaction) {
      throw Error(req.__('custom.material_status_has_transaction'))
    }
  } else {
    const childMasterMaterials = models.MasterMaterial.findAll({
      where: {
        parent_id: value,
        kfa_level_id: KFA_LEVEL_ID.VARIANT
      }
    })

    let countActiveMasterMaterial = 0
    await Promise.all(
      childMasterMaterials.map(async (childMasterMaterial) => {
        const checkActiveStock = await models.Stock.sum('qty', {
          group: ['entity_has_material_id'],
          include: [
            {
              association: 'entity_master_material',
              where: {
                master_material_id: childMasterMaterial.id,
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
              master_material_id: childMasterMaterial.id
            }
          }
        })
        const checkTransaction = await models.Transaction.count({
          where: {
            master_material_id: childMasterMaterial.id
          },
        })
          
        if (checkActiveStock || checkActiveOrder || checkTransaction) {
          countActiveMasterMaterial += 1
        }
      })
    ) 

    if (countActiveMasterMaterial == childMasterMaterials.length) {
      throw Error(req.__('custom.material_status_has_transaction'))
    }
  }
  return true
}

function checkActivitiesIfKfa(value, { req }) {
  if (!req.body.kfa || req.body.kfa.code == 93) {
    if (!value || value.length < 1) {
      throw Error(req.__('validator.not_empty', { field: req.__('field.id.activity_id') }))
    }
    
    else if (!Array.isArray(value)) {
      throw Error(req.__('validator.array', { field: req.__('field.id.activity_id') }))
    }
  }

  return true
}

async function checkKfaLevelHierarchy(value, {req}) {
  // value = kfa

  /* Temporary condition. Ideally every child material kfa level (in terms of code) if lesser than
  its parent then we should guard it, but since 92 is currently the highest level 
  and there are only two level, for now we hardcode this */ 
  if (value && value.code == 93 && !req.body.parent_id) {
    throw Error(req.__('validator.not_empty', { field: 'Parent ' + req.__('field.id.material_id') }))
  }

  if (value && req.body.parent_id) {
    const parentMasterMaterial = await models.MasterMaterial.findByPk(parseInt(req.body.parent_id))
    if (!parentMasterMaterial) {
      throw Error(req.__('validator.not_exist', { field: 'Parent ' + req.__('field.id.material_id') }))
    }
    
    const kfaLevelChild = await models.KfaLevel.findOne({
      where: {
        id: value.id
      }
    })
    const kfaLevelParent = await models.KfaLevel.findOne({
      where: {
        id: parentMasterMaterial.kfa_level_id
      }
    })
    
    if (kfaLevelChild.order_number <= kfaLevelParent.order_number) {
      throw Error(req.__('validator.kfa_level_hierarchy'))
    }
  }

  return true
}