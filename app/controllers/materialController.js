import { Op } from 'sequelize'
import models from '../models'
import errorResponse from '../helpers/errorResponse'
import { KFA_LEVEL_CODE, KFA_LEVEL_CODE_TO_ID, STATUS, TRANSACTION_TYPE } from '../helpers/constants'
import { parsingArrIds } from '../helpers/common'
import moment from 'moment'

const { Material, sequelize } = models

export async function list(req, res, next) {
  try {
    let condition = []

    const { keyword, status, is_vaccine } = req.query
    let { activity_id } = req.query
    const activityCondition = {}

    if (activity_id) {
      activity_id = parsingArrIds(activity_id)
      activityCondition.id = activity_id
    }

    if (keyword) condition.push({
      name: {
        [Op.like]: `%${keyword}%`
      }
    })
    if(status) condition.push({ status: STATUS.ACTIVE })
    if (is_vaccine) condition.push({is_vaccine: is_vaccine})
    if (condition.length > 0) req.condition = condition
    req.order= [
      [['name', 'ASC']]
    ]
    req.include = [
      /*{
        association: 'material_activities',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        where: activityCondition
      },*/
      {
        association: 'manufactures',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      {
        association: 'material_companion',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      {
        association : 'material_tags',
        attributes : ['id', 'title', 'is_ordered_sales', 'is_ordered_purchase'],
        through: { attributes: [] },
      }
    ]

    req.xlsColumns = [
      { key: 'name' },
      { key: 'description' },
      { key: 'pieces_per_unit', title: 'Pieces per unit of Distribution' },
      { key: 'unit', title: 'Unit of Consumption (piece)' },
      { key: 'unit_of_distribution', title: 'Unit of Distribution' },
      { key: 'temperature_sensitive' },
      { key: 'temperature_min' },
      { key: 'temperature_max' },
      { key: 'managed_in_batch' },
      { key: 'code' },
      { key: 'material_companion_label', title: 'material_companion' },
      { key: 'manufactures_label', title: 'manufactures' },
      { key: 'material_activities_label', title: 'material_activities' },
      { key: 'status_label', title: 'status' },
      { key: 'updated_at' },
      { key: 'user_updated_by_label', title: 'updated_by' },
    ]

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function listV2(req, res, next) {
  try {
    let condition = []

    const { keyword, status, is_vaccine, new_kfa, kfa_level } = req.query
    let { activity_id } = req.query
    const activityCondition = {}

    if (activity_id) {
      activity_id = parsingArrIds(activity_id)
      activityCondition.id = activity_id
    }

    if (keyword) condition.push({
      name: {
        [Op.like]: `%${keyword}%`
      }
    })
    if(status) condition.push({ status: STATUS.ACTIVE })
    if (is_vaccine) condition.push({is_vaccine: is_vaccine})
    if (new_kfa) condition.push({kfa_level_id: KFA_LEVEL_CODE_TO_ID[kfa_level]})
    if (condition.length > 0) req.condition = condition
    req.order= [
      [['name', 'ASC']]
    ]

    // Prepare association
    req.include = [
      {
        association: 'manufactures',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      {
        association: 'material_companion',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      {
        association : 'user_updated_by',
        attributes : ['id', 'firstname', 'lastname']
      }
    ]

    if (new_kfa) {
      req.include.push(
        {
          association: 'kfa_level',
          attributes: ['id', 'code'],
        }
      )
      req.include.push(
        {
          association: 'parent',
          attributes: ['id', 'name', 'kfa_code'],
        }
      )
    }
    if (!new_kfa || kfa_level != KFA_LEVEL_CODE.TEMPLATE) {
      req.include.push(
        {
          association: 'material_activities',
          attributes: ['id', 'name'],
          through: { attributes: [] },
          where: activityCondition
        }
      )
    }

    // Prepare xls column
    req.xlsColumns = [
      { key: 'name' },
      { key: 'description' },
      { key: 'pieces_per_unit', title: 'Pieces per unit of Distribution' },
      { key: 'unit', title: 'Unit of Consumption (piece)' },
      { key: 'unit_of_distribution', title: 'Unit of Distribution' },
      { key: 'temperature_sensitive' },
      { key: 'temperature_min' },
      { key: 'temperature_max' },
      { key: 'managed_in_batch' },
      { key: 'code' },
      { key: 'material_companion_label', title: 'material_companion' },
      { key: 'manufactures_label', title: 'manufactures' },
      { key: 'material_activities_label', title: 'material_activities' },
      { key: 'status_label', title: 'status' },
      { key: 'updated_at' },
      { key: 'user_updated_by_label', title: 'updated_by' },
    ]

    if (new_kfa) {
      req.xlsColumns.splice(14, 0, { key: 'kfa_level_label', title: 'kfa_level' })
    }
    if (new_kfa && kfa_level == KFA_LEVEL_CODE.VARIANT) {
      req.xlsColumns.splice(15, 0, { key: 'parent_label', title: 'parent' })
      req.xlsColumns.splice(16, 0, { key: 'parent_kfa_code_label', title: 'parent_kfa_code' })
    }

    // Prepare filename
    if (new_kfa) {
      const kfaName = kfa_level == KFA_LEVEL_CODE.TEMPLATE
        ? req.__('field.kfa_level.template')
        : req.__('field.kfa_level.variant')
      const formatDate = moment().format('MM-DD-YYYY HH_mm_ss') + ' GMT' + moment().format('ZZ')
      req.xlsFilename = `Material ${kfaName} ${formatDate}`
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    let include = [
      {
        association: 'manufactures',
        attributes: [
          'id',
          'name',
          'reference_id',
          'description',
          'contact_name',
          'phone_number',
          'email',
          'address',
          'status'
        ],
        through: {attributes: []}
      },
      {
        association: 'material_tags',
        attributes: ['id', 'title', 'is_ordered_sales', 'is_ordered_purchase'],
        through: {attributes: []}
      },
      {
        association: 'material_companion',
        attributes: ['id', 'name'],
        through: {attributes: []}
      },
      {
        association: 'material_conditions',
        attributes: ['id', 'key', 'value', 'type']
      }
    ]

    req.include = include

    req.mappingData = mappingData
    
    return next()
  } catch (err) {
    return next(err)
  }
}

const materialConditionField = [
  'roles',
  'entity_types'
]

async function createMaterialCondition(data) {
  const { body, material, transaction_type } = data
  const returnData = {}
  for(let i = 0; i<materialConditionField.length; i++) {
    const condition = materialConditionField[i]
    const values = body[condition]
    await models.MaterialCondition.destroy({ where: [
      { material_id: material.id }, 
      { key: condition }, 
      { type: transaction_type }
    ]})
    if(Array.isArray(values) && values.length > 0) {
      const conditionMaterial = values.map(item => {
        return {
          material_id: material.id,
          key: condition,
          value: item,
          type: transaction_type
        }
      })
      const isSaveConditions = await models.MaterialCondition.bulkCreate(conditionMaterial)
      if (!isSaveConditions) throw Error(`Material ${condition} gagal di simpan`)
    }
    returnData[condition] = values
  }
  return returnData
}

export async function create(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { material_companion, material_tags, manufactures, is_stockcount, is_addremove } = req.body
    const createField = req.body
    createField.updated_by = req.user.id
    createField.created_by = req.user.id
    delete createField.id

    const material = await Material.create(createField, { transaction: t })
    
    await t.commit()

    const data = await Material.findByPk(material.dataValues.id)
    if (!data) return res.status(400).json(errorResponse('Data tidak ditemukan'))

    if(material_companion && Array.isArray(material_companion) && material_companion.length > 0) {
      const isSaveCompanions = await data.setMaterial_companion(material_companion)
      if (!isSaveCompanions) return res.status(400).json(errorResponse('Material companion gagal di simpan'))
    }
    if(Array.isArray(material_tags) && material_tags.length > 0) {
      const isSaveTags = await material.setMaterial_tags(material_tags)
      if (!isSaveTags) return res.status(400).json(errorResponse('Material tag gagal di simpan'))
    }
    if(Array.isArray(manufactures) && manufactures.length > 0) {
      const isSaveManufactures = await material.setManufactures(manufactures)
      if (!isSaveManufactures) return res.status(400).json(errorResponse('Material manufacture gagal di simpan'))
    }
    if(is_stockcount) {
      const stockCount = await createMaterialCondition({ 
        body: req.body['stockcount'], 
        material: data, 
        transaction_type: TRANSACTION_TYPE.STOCK_COUNT
      })
      data.setDataValue('stockcount', stockCount)
    }
    if(is_addremove) {
      const addRemove = await createMaterialCondition({ 
        body: req.body['addremove'], 
        material: data, 
        transaction_type: TRANSACTION_TYPE.ADD_STOCK
      })
      data.setDataValue('addremove', addRemove)
    }
    
    return res.status(201).json(data)
  } catch (err) {
    return next(err)
  }
}

export async function update(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { material_companion, material_tags, manufactures, is_stockcount, is_addremove } = req.body
    const updateField = req.body
    updateField.updated_by = req.user.id
    delete updateField.id

    let material = await Material.findByPk(id)
    if (!material) return res.status(400).json(errorResponse('Data tidak ditemukan'))

    material = await material.update(updateField,  { transaction: t })

    await t.commit()

    await material.setManufactures(null)
    await material.setMaterial_companion(null)
    await material.setMaterial_tags(null)
    
    if(material_companion && Array.isArray(material_companion) && material_companion.length > 0) {
      const isSaveCompanions = await material.setMaterial_companion(material_companion)
      if (!isSaveCompanions) return res.status(400).json(errorResponse('Material companion gagal di simpan'))
    }
    if(Array.isArray(material_tags) && material_tags.length > 0) {
      const isSaveTags = await material.setMaterial_tags([material_tags[0]])
      if (!isSaveTags) return res.status(400).json(errorResponse('Material tag gagal di simpan'))
    }
    if(Array.isArray(manufactures) && manufactures.length > 0) {
      const isSaveManufactures = await material.setManufactures(manufactures)
      if (!isSaveManufactures) return res.status(400).json(errorResponse('Material manufacture gagal di simpan'))
    }

    if(is_stockcount) {
      const stockCount = await createMaterialCondition({ 
        body: req.body['stockcount'], 
        material: material, 
        transaction_type: TRANSACTION_TYPE.STOCK_COUNT
      })
      material.setDataValue('stockcount', stockCount)
    }
    if(is_addremove) {
      const addRemove = await createMaterialCondition({ 
        body: req.body['addremove'], 
        material: material, 
        transaction_type: TRANSACTION_TYPE.ADD_STOCK
      })
      material.setDataValue('addremove', addRemove)
    }
    return res.status(200).json(material)
  } catch (err) {
    return next(err)
  }
}

const mappingData = ({ data: material, req }) => {
  let addremove, stockcount = {
    entity_types: [],
    roles: []
  }
  const materialConditions = material.material_conditions
  const conditions = [
    { label: 'stockcount', type: TRANSACTION_TYPE.STOCK_COUNT },
    { label: 'addremove', type: TRANSACTION_TYPE.ADD_STOCK }
  ]
  conditions.forEach(con => {
    const { label } = con
    const entity_types = []
    const roles = []
    materialConditions.filter(el => parseInt(el.type) === con.type)
      .forEach(condition => {
        const conditionValue = parseInt(condition.value)
        if (condition.key === 'entity_types') {
          entity_types.push(conditionValue)
        } else if (condition.key === 'roles') {
          roles.push(conditionValue)
        }
      })
    if(label === 'addremove') addremove = { entity_types, roles }
    else if(label === 'stockcount') stockcount = { entity_types, roles}
  })
  delete material.dataValues['material_conditions']
  return {
    ...material.dataValues,
    addremove,
    stockcount
  }
}
