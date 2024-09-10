import models from '../../models'
import errorResponse from '../../helpers/errorResponse'
import { KFA_LEVEL_CODE, KFA_LEVEL_ID } from '../../helpers/constants'
import { Op } from 'sequelize'

const { sequelize } = models

export async function list(req, res, next) {
  try {
    let { entity_id, activity_id, kfa_level } = req.query
    
    if (!entity_id) entity_id = req.entityID
    let condition = {}

    /* IMPORTANT! This if code block below is messy coding practice, refactor is needed */
    if (kfa_level || kfa_level == KFA_LEVEL_CODE.TEMPLATE) {
      req.model = 'EntityMasterMaterial'

      condition = { entity_id: entity_id }

      req.include = [
        {
          association: 'material',
          attributes: models.MasterMaterial.getBasicAttribute(),
          where: {
            kfa_level_id: KFA_LEVEL_ID.TEMPLATE 
          },
          duplicating: false
        },
        {
          association: 'user_updated_by',
          attributes: ['id', 'firstname', 'lastname', 'fullname'],
        }
      ]

      if (JSON.stringify(condition) !== '{}') req.condition = condition

      req.mappingDocs = ({ docs }) =>
        docs.map((entityMaterial) => {
          const { material } = entityMaterial
          delete entityMaterial.dataValues.material
          delete material.dataValues.updated_at
          delete material.dataValues.id
    
          return {
            ...entityMaterial.dataValues,
            ...material.dataValues,
          }
        })
    } else {
      if (activity_id) {
        condition = { activity_id: activity_id }
      }
    
      req.include = [
        {
          association: 'entity_master_material',
          as: 'entity_master_material',
          attributes: models.EntityMasterMaterial.getBasicAttribute(),
          where: { entity_id: entity_id },
          required: true,
          include: [
            {
              association: 'material',
              attributes: models.MasterMaterial.getBasicAttribute(),
            },
          ],
        },
        {
          association: 'activity',
          attributes: ['id', 'name'],
        },
        {
          association: 'user_updated_by',
          attributes: ['id', 'firstname', 'lastname', 'fullname'],
        },
      ]
    
      if (JSON.stringify(condition) !== '{}') req.condition = condition
    
      req.mappingDocs = ({ docs }) =>
        docs.map((entityActivity) => {
          let { entity_master_material } = entityActivity
          let material = { ...entity_master_material?.material?.dataValues }
          delete entityActivity.dataValues.entity_master_material.dataValues
            .material
          delete material.updated_at
    
          return {
            entity_master_material_activities_id: entityActivity.dataValues.id,
            available: entityActivity.available,
            ...entityActivity.dataValues,
            ...material,
          }
        })
    }

    next()
  } catch (err) {
    return next(err)
  }
}

export async function create(req, res, next) {
  const trx = await sequelize.transaction()
  try {
    const { user } = req

    let { master_material_id, entity_id, min, max } = req.body

    let entityMaterial = {
      master_material_id,
      entity_id,
      min,
      max,
      allocated_stock: 0,
      on_hand_stock: 0,
      total_open_vial: 0,
      extermination_discard_qty: 0,
      extermination_received_qty: 0,
      extermination_qty: 0,
      extermination_shipped_qty: 0,
      created_by: user.id,
      updated_by: user.id
    }

    let EntityMasterMaterialModel = models.EntityMasterMaterial
    let EntityMasterMaterialActivityModel = models.EntityMasterMaterialActivities
    delete req.body.id
    delete req.body.master_material_id
    delete req.body.entity_id
    delete req.body.material_id

    let data = {}

    data = await EntityMasterMaterialModel.findOne({
      where: { master_material_id: master_material_id, entity_id: entity_id },
      paranoid: false,
      transaction: trx
    })

    const options = {
      locale: req.getLocale(),
      subject: req.__('custom.user_created'),
    }

    if (user) {
      req.body.created_by = user.id
      req.body.updated_by = user.id
    }
    
    if (data) {
      req.body.entity_master_material_id = data.id
        
      if (data.deleted_at) {
        entityMaterial.deleted_at = null
        data.setDataValue('deleted_at', null)
        data.setDataValue('deleted_by', null)
        data = await data.update(entityMaterial, { transaction: trx })
      } else {
        return res.status(422).json(
          errorResponse(
            'Unprocessable Entity', 
            {
              entity_master_material: [
                req.__('validator.exist', {field: req.__('field.id.entity_master_material_id')})
              ]
            } 
          )
        )
      }
    } else {
      data = await EntityMasterMaterialModel.create(entityMaterial, options, {
        transaction: trx
      })
      req.body.entity_master_material_id = data.id
    }

    

    const masterMaterial = await models.MasterMaterial.findOne({
      where: { id: master_material_id },
      transaction: trx
    })
    
    /* Check if material is for logistic 92 or imunization.
    If for material logistic 92 then dont create emma relation */
    if (!masterMaterial.kfa_level_id || masterMaterial.kfa_level_id != KFA_LEVEL_ID.TEMPLATE
    ) {
      data = await EntityMasterMaterialActivityModel.findOne({
        where: {
          entity_master_material_id: req.body.entity_master_material_id,
          activity_id: req.body.activity_id,
        },
        paranoid: false,
        transaction: trx
      })

      if (user) {
        req.body.created_by = user.id
        req.body.updated_by = user.id
      }

      if (data) {
        if (data.deleted_at) {
          req.body.deleted_at = null
          data.setDataValue('deleted_at', null)
          data.setDataValue('deleted_by', null)
          data = await data.update(req.body, { transaction: trx})
        } else
          return res.status(422).json(
            errorResponse(
              'Unprocessable Entity',
              {
                entity_master_material_activity: [
                  req.__('field.id.entity_master_material_id') + ' & ' + req.__('validator.exist', { field: req.__('field.id.activity_id') })
                ]
              } 
            )
          )
      }

      data = await EntityMasterMaterialActivityModel.create(req.body, options, {
        transaction: trx,
      })

      data = await EntityMasterMaterialActivityModel.findByPk(data.id, { transaction: trx })
    }

    /* Check if we create ehmm for logistic 92, if so, then we create ehmm and emma for all 
    of the 92 children with relation to each respective 93 mmha. Imunization should completely
    ignore this code block since it doesnt have kfa_level_id */
    if (masterMaterial.kfa_level_id == KFA_LEVEL_ID.TEMPLATE) {
      /* Find or create ehmm for 92 child */
      const childMasterMaterials = await models.MasterMaterial.findAll({
        include: {
          association: 'material_activities',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        where: {
          parent_id: masterMaterial.id,
          kfa_level_id: KFA_LEVEL_ID.VARIANT,
        },
        transaction: trx
      })

      let postInsertChildEntityMasterMaterialIds = await Promise.all(
        childMasterMaterials.map(async (childMasterMaterial) => {
          const [entityMasterMaterial, created] =
          await EntityMasterMaterialModel.findOrCreate({
            where: {
              entity_id: entity_id,
              master_material_id: childMasterMaterial.id,
            },
            defaults: {
              ...entityMaterial,
              entity_id: entity_id,
              master_material_id: childMasterMaterial.id,
            },
            paranoid: false,
            transaction: trx,
          })
                    
          if(!created) {
            entityMasterMaterial.setDataValue('deleted_at', null)
            entityMasterMaterial.setDataValue('deleted_by', null)
            await entityMasterMaterial.save({ transaction: trx })
          }
        
          return entityMasterMaterial.id
        })
      )
      
      /* Find or create emma for 92 child */
      const postInsertChildEntityMasterMaterial = await models.EntityMasterMaterial.findAll({
        include: {
          association: 'material',
          include: {
            association: 'material_activities',
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        },
        where: {
          id: {
            [Op.in]: postInsertChildEntityMasterMaterialIds
          }
        },
        paranoid: false,
        transaction: trx
      })
        
      let entityMasterMaterialActivitiesData = []
      postInsertChildEntityMasterMaterial.forEach((entityMasterMaterial) => {
        entityMasterMaterial.material.material_activities.forEach((masterMaterialActivity) => {
          entityMasterMaterialActivitiesData.push({
            entity_master_material_id: entityMasterMaterial.id,
            activity_id: masterMaterialActivity.id,
            min: req.body.min,
            max: req.body.max,
            consumption_rate: req.body.consumption_rate,
            retailer_price: req.body.retailer_price,
            tax: req.body.tax,
            created_by: user.id,
            updated_by: user.id
          })
        })
      })

      data = await Promise.all(
        entityMasterMaterialActivitiesData.map(async (emmaData) => {
          const [entityMasterMaterialActivity, created] =
            await EntityMasterMaterialActivityModel.findOrCreate({
              where: {
                entity_master_material_id: emmaData.entity_master_material_id,
                activity_id: emmaData.activity_id,
              },
              defaults: {
                ...emmaData
              },
              paranoid: false,
              transaction: trx
            })

          if (!created) {
            entityMasterMaterialActivity.setDataValue('deleted_at', null)
            await entityMasterMaterialActivity.save({ transaction: trx })
          }

          return entityMasterMaterialActivity
        })
      )
    }

    await trx.commit()
    return res.status(201).json(data)
  } catch (err) {
    await trx.rollback()
    return next(err)
  }
}

export async function update(req, res, next) {
  const trx = await sequelize.transaction()
  try {
    const { id } = req.params
    const { kfa_level } = req.body
    const { user } = req

    const EntityMasterMaterialModel = models.EntityMasterMaterial
    const EntityMasterMaterialActivityModel = models.EntityMasterMaterialActivities

    let data = null
    
    if (!kfa_level) {
      if (user) {
        req.body.updated_by = user.id
      }
      delete req.body.id
      data = await EntityMasterMaterialActivityModel.findByPk(id, { transaction: trx })
      if (!data) throw { status: 404, message: req.__('404') }
      data = await data.update(req.body, { transaction: trx })
    } else {
      const entityMasterMaterial = await EntityMasterMaterialModel.findByPk(id, { transaction: trx })
        
      const entityId = entityMasterMaterial.entity_id
      const masterMaterialId = entityMasterMaterial.master_material_id

      const childEntityMasterMaterial = await EntityMasterMaterialModel.findAll({
        where: {
          entity_id: entityId,
        },
        include: [
          {
            association: 'material',
            where: {
              parent_id: masterMaterialId 
            },
            duplicating: false
          }
        ],
        transaction: trx 
      })

      const childEntityMasterMaterialIds = childEntityMasterMaterial.map((childEntityMasterMaterial) => {
        return childEntityMasterMaterial.id
      })

      entityMasterMaterial.setDataValue('min', req.body.min)
      entityMasterMaterial.setDataValue('max', req.body.max)
      await entityMasterMaterial.save({ transaction: trx })

      await EntityMasterMaterialModel.update(
        {
          min: req.body.min,
          max: req.body.max,
        },
        {
          where: {
            id: {
              [Op.in]: childEntityMasterMaterialIds
            }
          },
          transaction: trx
        }
      )

      delete req.body.id
      delete req.body.entity_master_material_id
      delete req.body.activity_id
      data = await EntityMasterMaterialActivityModel.update(
        req.body,
        {
          where: {
            entity_master_material_id: {
              [Op.in]: childEntityMasterMaterialIds
            }
          },
          transaction: trx
        }
      )
    }

    await trx.commit()
    return res.status(200).json({ message: 'success' })
  } catch (error) {
    await trx.rollback()
    return next(error)
  }
}

export async function destroy(req, res, next) {
  const trx = await sequelize.transaction()

  try {
    const { id } = req.params
    const { kfa_level } = req.body
    const { user } = req

    const EntityMasterMaterialActivitiesModel = models.EntityMasterMaterialActivities
    const EntityMasterMaterialModel = models.EntityMasterMaterial
    
    if (!kfa_level) {
      let data = {}
      if (user) {
        req.body.deleted_by = user.id
      }
      data = await EntityMasterMaterialActivitiesModel.findByPk(id, { transaction: trx })
      if (!data) throw { status: 404, message: req.__('404') }
      let entityMasterMaterialId = data.entity_master_material_id
      await data.update(req.body, { transaction: trx })
      await data.destroy({ transaction: trx })

      data = await EntityMasterMaterialActivitiesModel.findOne({
        where: { entity_master_material_id: entityMasterMaterialId },
      })

      if (!data) {
        data = await EntityMasterMaterialModel.findByPk(entityMasterMaterialId)
        await data.update(req.body, { transaction: trx })
        await data.destroy({ transaction: trx })
      }
    } else {
      const entityMasterMaterial = await EntityMasterMaterialModel.findByPk(id, { transaction: trx })
        
      const entityId = entityMasterMaterial.entity_id
      const masterMaterialId = entityMasterMaterial.master_material_id

      const childEntityMasterMaterial = await EntityMasterMaterialModel.findAll({
        where: {
          entity_id: entityId,
        },
        include: [
          {
            association: 'material',
            where: {
              parent_id: masterMaterialId 
            },
            duplicating: false
          }
        ],
        transaction: trx 
      })

      const childEntityMasterMaterialIds = childEntityMasterMaterial.map((childEntityMasterMaterial) => {
        return childEntityMasterMaterial.id
      })

      await entityMasterMaterial.destroy({ transaction: trx })
      await EntityMasterMaterialModel.destroy({
        where: {
          id: {
            [Op.in]: childEntityMasterMaterialIds
          }
        },
        transaction: trx
      })

      await EntityMasterMaterialActivitiesModel.destroy({
        where: {
          entity_master_material_id: {
            [Op.in]: childEntityMasterMaterialIds
          }
        },
        transaction: trx
      })
    }

    await trx.commit()
    return res.status(200).json({ message: 'success' })
  } catch (err) {
    await trx.rollback()
    return next(err)
  }
}

export async function listResponseEntity(req, res, next) {
  try {
    let { page, paginate } = req.query
    if (!page || page === '') page = 1
    if (!paginate || paginate === '') paginate = 10

    let { user } = req

    if (user.role == 11) {
      let manufacture = await models.Manufacture.findByPk(user.manufacture_id)
      if (manufacture.type !== 1) {
        throw { status: 403, message: 'Forbidden Access' }
      }
    }

    const {
      model,
      condition = {},
      attributes,
      order,
      include,
      customOptions,
    } = req

    const options = {
      order,
      attributes,
      limit: Number(paginate),
      offset: (page - 1) * Number(paginate),
      where: condition,
      duplicating: false,
      ...customOptions,
    }

    if (include && typeof include === 'object') options.include = include

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let docs = []
    let total = 10
    const { mappingDocs } = req

    if (Model) {
      docs = await Model.findAll(options)
      const countOptions = {
        ...options,
        include: options.include,
      }

      total = await Model.count({ ...countOptions, subQuery: false })

      if (typeof req.mappingDocs === 'function' && Array.isArray(docs)) {
        docs = await mappingDocs({ docs, req })
      }
    }

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    //return res.status(200).json(listResponse(total, page, paginate, docs))
    return res.status(200).json({
      total: total,
      page: page,
      perPage: paginate,
      materials: docs,
    })
  } catch (err) {
    console.error(err, '===')
    return next(err)
  }
}
