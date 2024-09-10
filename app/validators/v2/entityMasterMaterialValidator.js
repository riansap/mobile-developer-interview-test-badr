import { body, param } from 'express-validator'
import { commonNotExistsId, commonNotGreaterThan, commonExistsTwoFieldUpdate } from '../customValidator'
import models from '../../models'
import { Op } from 'sequelize'

export const generalMasterMaterialActivities = [

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
    .custom(commonNotGreaterThan('min', 'material_entity.max', 'material_entity.min')),
]

export const updateEntityMasterMaterialActivities = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.id')
    })),
  body('entity_master_material_id')
    .custom(checkIfUpdateLogistic)
    .custom(commonNotExistsId('EntityMasterMaterial', 'id.entity_master_material_id'))
    .custom(commonExistsTwoFieldUpdate('EntityMasterMaterialActivities', 'entity_master_material_id', 'activity_id')),
  body('activity_id')
    .custom(checkIfUpdateLogistic)
    .custom(commonNotExistsId('MasterActivity', 'id.activity_id'))
    .custom(activityAvailable),
  ...generalMasterMaterialActivities
]

async function checkIfUpdateLogistic(value, { req }) {
  const { kfa_level } = req.body
  
  if (!kfa_level && !value) {
    throw Error(req.__('validator.not_empty', { field: req.__('field.id.activity_id') }))
  }

  if (!kfa_level && isNaN(value)) {
    throw Error(req.__('validator.number', { field: req.__('field.id.activity_id') }))
  }

  return true
}

export const createEntityMasterMaterialActivities = [
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
  body('entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.id.entity_id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.id.entity_id')
    }))
    .custom(commonNotExistsId('Entity', 'id.entity_id')),
  body('activity_id')
    .custom(checkIfMaterialLogistic)
    .custom(commonNotExistsId('MasterActivity', 'id.activity_id'))
    .custom(activityAvailable2),
  ...generalMasterMaterialActivities
]

async function checkIfMaterialLogistic(value, {req}) {
  const masterMaterial = await models.MasterMaterial.findOne({
    where: { id: req.body.master_material_id },
  })

  if (!masterMaterial.kfa_level_id && !value) {
    throw Error(req.__('validator.not_empty', { field: req.__('field.id.activity_id') }))
  }

  if (!masterMaterial.kfa_level_id && isNaN(value)) {
    throw Error(req.__('validator.number', { field: req.__('field.id.activity_id') }))
  }
  
  return true
}

async function activityAvailable(value, { req }) {
  if (value) {
    const id = req.body.entity_master_material_id
    const materialEntity = await models.EntityMasterMaterial.findByPk(id)
    if (!materialEntity) throw Error(req.__('404'))

    const materialActivities = await models.MasterMaterialActivities.findOne({
      where: {
        activity_id: value,
        master_material_id: materialEntity.master_material_id
      }
    })

    if (!materialActivities) {
      throw Error(req.__('validator.activity_not_exist_in_material'))
    }
  }
  return true
}

async function activityAvailable2(value, { req }) {
  if (value) {
    const master_material_id = req.body.master_material_id

    const materialActivities = await models.MasterMaterialActivities.findOne({
      where: {
        activity_id: value,
        master_material_id: master_material_id
      }
    })

    if (!materialActivities) {
      throw Error(req.__('validator.activity_not_exist_in_material'))
    }
  }
  return true
}

async function checkActiveOrder(value, { req }) {
  const { kfa_level } = req.body

  if (value && !kfa_level) {
    const entityActivity = await models.EntityMasterMaterialActivities.findByPk(value)
    if (!entityActivity) {
      throw Error(req.__('404'))
    }
    const materialEntity = await models.EntityMasterMaterial.findByPk(entityActivity.entity_master_material_id)
    if (!materialEntity) throw Error(req.__('404'))

    const countActiveOrder = await models.Order.count({
      where: {
        [Op.or]: [
          { customer_id: materialEntity.entity_id },
          { vendor_id: materialEntity.entity_id }
        ]
      },
      include: {
        association: 'order_items',
        required: true,
        where: {
          master_material_id: materialEntity.master_material_id
        }
      }
    })

    const countTransaction = await models.Transaction.count({
      where: {
        [Op.or]: [
          { customer_id: materialEntity.entity_id },
          { vendor_id: materialEntity.entity_id },
          { entity_id: materialEntity.entity_id }
        ],
        master_material_id: materialEntity.master_material_id
      },
    })
    
    if (countActiveOrder) {
      throw Error(
        req.__('validator.delete_active_order')
      )
    } else if (countTransaction) {
      throw Error(
        req.__('validator.delete_has_transaction')
      )
          
    }
  } else {
    const entityMasterMaterial = await models.EntityMasterMaterial.findByPk(value)
    if (!entityMasterMaterial) {
      throw Error(req.__('404'))
    }

    const childEntityMasterMaterial = await models.EntityMasterMaterial.findAll({
      where: {
        entity_id: entityMasterMaterial.entity_id,
      },
      include: [
        {
          association: 'material',
          where: {
            parent_id: entityMasterMaterial.master_material_id 
          },
          duplicating: false
        }
      ]
    })

    const childMasterMaterialIds = childEntityMasterMaterial.map((childEntityMasterMaterial) => {
      return childEntityMasterMaterial.master_material_id
    })

    const countActiveOrder = await models.Order.count({
      where: {
        [Op.or]: [
          { customer_id: entityMasterMaterial.entity_id },
          { vendor_id: entityMasterMaterial.entity_id },
        ]
      },
      include: {
        association: 'order_items',
        required: true,
        where: {
          master_material_id: {
            [Op.in]: childMasterMaterialIds
          }
        }
      }
    })

    const countTransaction = await models.Transaction.count({
      where: {
        [Op.or]: [
          { customer_id: entityMasterMaterial.entity_id },
          { vendor_id: entityMasterMaterial.entity_id },
          { entity_id: entityMasterMaterial.entity_id }
        ],
        master_material_id: {
          [Op.in]: childMasterMaterialIds
        }
      },
    })

    if (countActiveOrder) {
      throw Error(
        req.__('validator.delete_active_order')
      )
    } else if (countTransaction) {
      throw Error(
        req.__('validator.delete_has_transaction')
      )
        
    }
  }
  return true
}

export const destroyEntityMaterialActivities = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.material_entity.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material_entity.id')
    }))
    .custom(checkActiveOrder)
]
