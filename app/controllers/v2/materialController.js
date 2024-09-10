import { Op, Sequelize } from 'sequelize'
import models from '../../models'
import path from 'path'
import fs from 'fs'

import errorResponse from '../../helpers/errorResponse'
import { TRANSACTION_TYPE, STATUS, KFA_LEVEL_ID, KFA_LEVEL_CODE, KFA_LEVEL_CODE_TO_ID, MATERIAL_KFA_TYPE_XLS } from '../../helpers/constants'
import { parsingArrIds, filterLeveling } from '../../helpers/common'
import { validationSchema } from '../../helpers/xls/xlsValidationSchema'

const readXlsxFile = require('read-excel-file/node')
const { sequelize } = models

export async function list(req, res, next) {
  try {
    let condition = []

    let {
      keyword,
      status,
      is_vaccine,
      activity_id,
      code_kfa_ingredients,
      code_kfa_packaging,
      code_kfa_product_template,
      code_kfa_product_variant,
      kfa_level,
      new_kfa,
    } = req.query

    if (new_kfa) {
      new_kfa = parseInt(new_kfa)
    }

    const mappingMasterMaterialCondition = []

    if (code_kfa_ingredients) {
      mappingMasterMaterialCondition.push({
        code_kfa_ingredients: {
          [Op.in]: code_kfa_ingredients.split(',').map((item) => item.trim()),
        },
      })
    }

    if (code_kfa_product_template) {
      mappingMasterMaterialCondition.push({
        code_kfa_product_template: {
          [Op.in]: code_kfa_product_template
            .split(',')
            .map((item) => item.trim()),
        },
      })
    }

    if (code_kfa_product_variant) {
      mappingMasterMaterialCondition.push({
        code_kfa_product_variant: {
          [Op.in]: code_kfa_product_variant
            .split(',')
            .map((item) => item.trim()),
        },
      })
    }

    if (code_kfa_packaging) {
      mappingMasterMaterialCondition.push({
        code_kfa_packaging: {
          [Op.in]: code_kfa_packaging.split(',').map((item) => item.trim()),
        },
      })
    }

    const filterKfas = [
      {
        key: 'code_kfa_packaging',
        nextLevel: 'code_kfa_product_variant',
      },
      {
        key: 'code_kfa_product_variant',
        nextLevel: 'code_kfa_product_template',
      },
      {
        key: 'code_kfa_product_template',
        nextLevel: 'code_kfa_ingredients',
      },
      {
        key: 'code_kfa_ingredients',
        nextLevel: null,
      },
    ]

    const kfaResult = {
      code_kfa_ingredients: null,
      code_kfa_product_template: null,
      code_kfa_product_variant: null,
      code_kfa_packaging: null,
    }

    const filteredKfa = filterLeveling({
      data: mappingMasterMaterialCondition,
      filters: filterKfas,
      defaultResult: kfaResult,
    })

    Object.keys(filteredKfa).forEach((key) => {
      if (filteredKfa[key] === null || filteredKfa[key] === undefined) {
        delete filteredKfa[key]
      }
    })

    let mappingMasterMaterialOptions = {}

    if (Object.keys(filteredKfa).length > 0)
      mappingMasterMaterialOptions = {
        where: { [Op.or]: filteredKfa },
        required: true,
      }

    if (keyword)
      condition.push(
        {
          [Op.or]: [
            {
              name: {
                [Op.like]: `%${keyword}%`
              }
            },
            {
              code: {
                [Op.like]: `%${keyword}%`
              }
            }
          ]
        }
      )
    if (status) condition.push({ status: STATUS.ACTIVE })
    if (is_vaccine) {
      is_vaccine = parsingArrIds(is_vaccine)
      condition.push({ is_vaccine })
    }

    if (kfa_level && new_kfa) {
      const kfaLevel = await models.KfaLevel.findOne({
        where: {
          code: kfa_level,
        },
      })
      condition.push({ kfa_level_id: kfaLevel.id })
    }

    if (condition.length > 0) req.condition = condition

    req.order = [[['name', 'ASC']]]
    req.include = [
      {
        association: 'mapping_master_material',
        attributes: models.MappingMasterMaterial.getBasicAttribute(),
        ...mappingMasterMaterialOptions,
      },
      {
        association: 'manufactures',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        required: false,
      },
      {
        association: 'material_companion',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        required: false,
      },
      {
        association: 'user_updated_by',
        attributes: ['id', 'firstname', 'lastname'],
        required: false,
      },
    ]

    let activityCondition = null
    if (activity_id) {
      activity_id = parsingArrIds(activity_id)
      activityCondition = {
        id: { [Op.in]: activity_id }
      }
    }

    if (kfa_level == KFA_LEVEL_CODE.TEMPLATE && new_kfa) {
      req.include.push(
        {
          association: 'children',
          attributes: ['id', 'name'],
          include: [
            {
              association: 'material_activities',
              attributes: ['id', 'name', 'is_ordered_sales', 'is_ordered_purchase'],
              through: { attributes: [] },
              where: activityCondition,
              required: activityCondition ? true : false,
            },
          ]
        }
      )
    } else {
      req.include.push(
        {
          association: 'material_activities',
          attributes: ['id', 'name', 'is_ordered_sales', 'is_ordered_purchase'],
          through: { attributes: [] },
          where: activityCondition,
          required: activityCondition ? true : false,
        }
      )
    }

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
      { key: 'status_label', title: 'status' },
      { key: 'updated_at' },
      { key: 'user_updated_by_label', title: 'updated_by' },
    ]

    req.isFormatRelationCount = true
    req.customOptions = {
      distinct: true,
      col: 'id',
    }

    if (kfa_level == 92 && !new_kfa) {
      req.mappingDocs = ({ docs, req }) => {
        let data = []
        for (let item of docs) {
          const { mapping_master_material } = item

          if (mapping_master_material) {
            let index = data.findIndex(
              (it) =>
                it?.code_kfa_product_template ==
                item?.mapping_master_material?.code_kfa_product_template
            )
            if (index >= 0) {
              data[index].materials.push(item.dataValues)
            } else {
              data.push({
                code_kfa_ingredients:
                  mapping_master_material?.code_kfa_ingredients,
                name_kfa_ingredients:
                  mapping_master_material?.name_kfa_ingredients,
                code_kfa_product_template:
                  mapping_master_material?.code_kfa_product_template,
                name_kfa_product_template:
                  mapping_master_material?.name_kfa_product_template,
                materials: [item.dataValues],
              })
            }
          }
        }

        return data
      }
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
        association: 'mapping_master_material',
        attributes: models.MappingMasterMaterial.getBasicAttribute(),
      },
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
          'status',
        ],
        through: { attributes: [] },
      },
      {
        association: 'material_activities',
        attributes: ['id', 'name', 'is_ordered_sales', 'is_ordered_purchase'],
        through: { attributes: [] },
      },
      {
        association: 'material_companion',
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      {
        association: 'material_conditions',
        attributes: ['id', 'key', 'value', 'type'],
      },
      {
        association: 'material_type',
        attributes: ['id', 'name'],
      },
      {
        association: 'parent',
        attributes: ['id', 'name', 'kfa_code'],
      },
    ]

    req.include = include

    req.mappingData = mappingData

    return next()
  } catch (err) {
    return next(err)
  }
}

async function saveMaterialActivities({ material, activities }) {
  await material.setMaterial_activities(null)

  if (Array.isArray(activities) && activities.length > 0) {
    const isSaveActivites = await material.setMaterial_activities(activities)
    if (!isSaveActivites) throw Error('Material Activities gagal di simpan')
  }
  return true
}

async function saveMaterialManufactures({ material, manufactures }) {
  await material.setManufactures(null)

  if (Array.isArray(manufactures) && manufactures.length > 0) {
    const isSaveManufacture = await material.setManufactures(manufactures)
    if (!isSaveManufacture) throw Error('Material Manufacture gagal di simpan')
  }
  return true
}

async function saveMaterialCompanions({ material, material_companion }) {
  await material.setMaterial_companion(null)

  if (Array.isArray(material_companion) && material_companion.length > 0) {
    const isSaveCompanions = await material.setMaterial_companion(
      material_companion
    )
    if (!isSaveCompanions) throw Error('Material Companion gagal di simpan')
  }
  return true
}

/* This function is currently onyl exclusive for kfa 93 */
export async function saveMappingMasterMaterial({ material }) {
  const mappingMasterMaterial = await models.MappingMasterMaterial.findOne({
    where: {
      id_material_smile: material.id,
    },
  })

  const parentMasterMaterial = await models.MasterMaterial.findOne({
    where: { id: material.parent_id },
  })

  if (mappingMasterMaterial) {
    await mappingMasterMaterial.update({
      code_kfa_product_template: parentMasterMaterial.kfa_code,
      name_kfa_product_template: parentMasterMaterial.name,
      code_kfa_product_variant: material.kfa_code,
      name_kfa_product_variant: material.name,
    })
  } else {
    await models.MappingMasterMaterial.create({
      id_material_smile: material.id,
      code_kfa_product_template: parentMasterMaterial.kfa_code,
      name_kfa_product_template: parentMasterMaterial.name,
      code_kfa_product_variant: material.kfa_code,
      name_kfa_product_variant: material.name,
    })
  }

  return true
}

/* This function is currently onyl exclusive for kfa 93 */
export async function saveEntityMasterMaterial({ material, user }) {
  const parentMasterMaterial = await models.MasterMaterial.findOne({
    where: { id: material.parent_id },
  })

  const parentEntityMasterMaterial = await models.EntityMasterMaterial.findAll({
    where: {
      master_material_id: parentMasterMaterial.id
    }
  })

  const postInsertEntityMasterMaterialIds = await Promise.all(
    parentEntityMasterMaterial.map(async (parentEmm) => {
      const [entityMasterMaterial, created] =
        await models.EntityMasterMaterial.findOrCreate({
          where: {
            entity_id: parentEmm.entity_id,
            master_material_id: material.id,
          },
          defaults: {
            entity_id: parentEmm.entity_id,
            master_material_id: material.id,
            min: parentEmm.min,
            max: parentEmm.min,
            created_by: user.id,
            updated_by: user.id
          },
          paranoid: false,
        })

      if(!created) {
        entityMasterMaterial.setDataValue('deleted_at', null)
        entityMasterMaterial.setDataValue('deleted_by', null)
        await entityMasterMaterial.save()
      }

      return entityMasterMaterial.id
    })
  )

  const postInsertEntityMasterMaterial = await models.EntityMasterMaterial.findAll({
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
        [Op.in]: postInsertEntityMasterMaterialIds
      }
    },
    paranoid: false,
  })

  let entityMasterMaterialActivitiesData = []
  postInsertEntityMasterMaterial.forEach((entityMasterMaterial) => {
    entityMasterMaterial.material.material_activities.forEach((masterMaterialActivity) => {
      entityMasterMaterialActivitiesData.push({
        entity_master_material_id: entityMasterMaterial.id,
        activity_id: masterMaterialActivity.id,
        min: entityMasterMaterial.min,
        max: entityMasterMaterial.max,
        created_by: user.id,
        updated_id: user.id
      })
    })
  })

  await Promise.all(
    entityMasterMaterialActivitiesData.map(async (emmaData) => {
      const [entityMasterMaterialActivity, created] =
        await models.EntityMasterMaterialActivities.findOrCreate({
          where: {
            entity_master_material_id: emmaData.entity_master_material_id,
            activity_id: emmaData.activity_id,
          },
          defaults: {
            ...emmaData
          },
          paranoid: false,
        })

      if (!created) {
        entityMasterMaterialActivity.setDataValue('deleted_at', null)
        await entityMasterMaterialActivity.save()
      }

      return entityMasterMaterialActivity
    })
  )

  return true
}

async function createMasterMaterialCondition(data) {
  const { body, material, transaction_type } = data
  const materialConditionField =
    models.MasterMaterialCondition.getKeyAvailable()
  const returnData = {}
  for (let i = 0; i < materialConditionField.length; i++) {
    const condition = materialConditionField[i]
    const values = body[condition]
    await models.MasterMaterialCondition.destroy({
      where: [
        { master_material_id: material.id },
        { key: condition },
        { type: transaction_type },
      ],
    })
    if (Array.isArray(values) && values.length > 0) {
      const conditionMaterial = values.map((item) => {
        return {
          master_material_id: material.id,
          key: condition,
          value: item,
          type: transaction_type,
        }
      })
      const isSaveConditions = await models.MasterMaterialCondition.bulkCreate(
        conditionMaterial
      )
      if (!isSaveConditions)
        throw Error(`Material ${condition} gagal di simpan`)
    }
    returnData[condition] = values
  }
  return returnData
}

export async function create(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const {
      activities,
      manufactures,
      material_companion,
      is_stockcount,
      is_addremove,
      kfa,
      code_kfa,
      parent_id,
    } = req.body
    const createField = req.body
    createField.updated_by = req.user.id
    createField.created_by = req.user.id
    delete createField.id

    if (kfa) {
      createField.kfa_level_id = kfa.id
      createField.kfa_code = code_kfa
    }

    const rangeMaterialData = await models.RangeTemperature.findAll({
      raw: true,
    })
    if (createField.temperature_sensitive) {
      for (const item of rangeMaterialData) {
        if (
          createField.temperature_min === item.temperature_min &&
          createField.temperature_max === item.temperature_max
        ) {
          createField.range_temperature_id = item.id
        }
      }
    }

    const material = await models.MasterMaterial.create(createField, {
      transaction: t,
    })

    await t.commit()

    const data = await models.MasterMaterial.findByPk(material.dataValues.id)
    if (!data)
      return res.status(400).json(errorResponse('Data tidak ditemukan'))

    await saveMaterialActivities({ material, activities })
    await saveMaterialManufactures({ material, manufactures })
    await saveMaterialCompanions({ material, material_companion })

    if (kfa && kfa.code == 93 && parent_id) {
      await saveMappingMasterMaterial({ material })
      await saveEntityMasterMaterial({ material, user: req.user })
    }

    if (is_stockcount) {
      const stockCount = await createMasterMaterialCondition({
        body: req.body['stockcount'],
        material: data,
        transaction_type: TRANSACTION_TYPE.STOCK_COUNT,
      })
      data.setDataValue('stockcount', stockCount)
    }

    if (is_addremove) {
      const addRemove = await createMasterMaterialCondition({
        body: req.body['addremove'],
        material: data,
        transaction_type: TRANSACTION_TYPE.ADD_STOCK,
      })
      data.setDataValue('addremove', addRemove)
    }

    return res.status(201).json(data)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function update(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const {
      activities,
      manufactures,
      material_companion,
      is_stockcount,
      is_addremove,
      kfa,
      code_kfa,
      parent_id,
    } = req.body
    const updateField = req.body
    updateField.updated_by = req.user.id
    delete updateField.id

    if (kfa) {
      updateField.kfa_level_id = kfa.id
      updateField.kfa_code = code_kfa
    }

    const rangeMaterialData = await models.RangeTemperature.findAll({
      raw: true,
    })
    if (updateField.temperature_sensitive) {
      for (const item of rangeMaterialData) {
        if (
          updateField.temperature_min === item.temperature_min &&
          updateField.temperature_max === item.temperature_max
        ) {
          updateField.range_temperature_id = item.id
        }
      }
    }

    let material = await models.MasterMaterial.findByPk(id)
    if (!material)
      return res.status(400).json(errorResponse('Data tidak ditemukan'))

    material = await material.update(updateField, { transaction: t })

    await t.commit()

    const data = await models.MasterMaterial.findByPk(id)

    await saveMaterialActivities({ material, activities })
    await saveMaterialManufactures({ material, manufactures })
    await saveMaterialCompanions({ material, material_companion })

    if (kfa && kfa.code == 93 && parent_id && !data.parent_id) {
      await saveMappingMasterMaterial({ material })
      await saveEntityMasterMaterial({ material, user: req.user })
    }

    if (is_stockcount) {
      const stockCount = await createMasterMaterialCondition({
        body: req.body['stockcount'],
        material: data,
        transaction_type: TRANSACTION_TYPE.STOCK_COUNT,
      })
      data.setDataValue('stockcount', stockCount)
    }

    if (is_addremove) {
      const addRemove = await createMasterMaterialCondition({
        body: req.body['addremove'],
        material: data,
        transaction_type: TRANSACTION_TYPE.ADD_STOCK,
      })
      data.setDataValue('addremove', addRemove)
    }

    return res.status(200).json(material)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function updateStatus(req, res, next) {
  const trx = await sequelize.transaction()
  try {
    const { id } = req.params
    const { user } = req
    const masterMaterial = await models.MasterMaterial.findByPk(id, { transaction: trx })
    if (!masterMaterial) throw { status: 404, message: req.__('404') }
    if (user) {
      req.body.updated_by = user.id
    }

    let response = {}
    if (!masterMaterial.kfa_level_id || masterMaterial.kfa_level_id != KFA_LEVEL_ID.TEMPLATE) {
      delete req.body.id
      await masterMaterial.update(req.body, { transaction: trx })
    } else {
      const childMasterMaterials = await models.MasterMaterial.findAll({
        where: {
          parent_id: id,
          kfa_level_id: KFA_LEVEL_ID.VARIANT
        },
        transaction: trx
      })

      let liveMasterMaterials = [] 
      let dormantMasterMaterials = []
      await Promise.all(
        childMasterMaterials.map(async (childMasterMaterial) => {
          const checkTransaction = await models.Transaction.count({
            where: {
              master_material_id: childMasterMaterial.id
            },
            transaction: trx
          })

          if (checkTransaction) {
            liveMasterMaterials.push(childMasterMaterial)            
          } else {
            dormantMasterMaterials.push(childMasterMaterial)
          }
        })
      )

      if (liveMasterMaterials.length === 0) {
        await masterMaterial.update(req.body, { transaction: trx })
      }

      if (dormantMasterMaterials.length > 0) {
        await Promise.all(
          dormantMasterMaterials.map(async (dormantMasterMaterial) => {
            await dormantMasterMaterial.update(req.body, { transaction: trx })
          })
        )
      }
    }
        
    await trx.commit()
    return res.status(200).json({ message: req.__('200') })
  } catch (error) {
    await trx.rollback()
    return next(error)    
  }
}

const mappingData = ({ data: material }) => {
  let addremove,
    stockcount = {
      entity_types: [],
      roles: [],
    }
  const materialConditions = material.material_conditions
  const conditions = [
    { label: 'stockcount', type: TRANSACTION_TYPE.STOCK_COUNT },
    { label: 'addremove', type: TRANSACTION_TYPE.ADD_STOCK },
  ]
  conditions.forEach((con) => {
    const { label } = con
    const entity_types = []
    const roles = []
    materialConditions
      .filter((el) => parseInt(el.type) === con.type)
      .forEach((condition) => {
        const conditionValue = parseInt(condition.value)
        if (condition.key === 'entity_types') {
          entity_types.push(conditionValue)
        } else if (condition.key === 'roles') {
          roles.push(conditionValue)
        }
      })
    if (label === 'addremove') addremove = { entity_types, roles }
    else if (label === 'stockcount') stockcount = { entity_types, roles }
  })
  delete material.dataValues['material_conditions']
  return {
    ...material.dataValues,
    addremove,
    stockcount,
  }
}

export async function materialBiofarma(req, res, next) {
  try {
    let { page = 1, paginate = 10, keyword } = req.query

    let condition = []
    if (keyword) condition.push({ produk: { [Op.like]: `%${keyword}%` } })

    const docs = await models.BiofarmaOrder.findAll({
      attributes: [['produk', 'name']],
      group: ['produk'],
      where: condition,
      limit: Number(paginate),
      offset: (Number(page) - 1) * Number(paginate),
      order: [['produk', 'ASC']],
    })

    const total = await models.BiofarmaOrder.count({
      attributes: ['produk'],
      group: ['produk'],
      where: condition,
    })

    res.json({
      total: total.length,
      page: Number(page),
      perPage: Number(paginate),
      list: docs,
    })
  } catch (err) {
    next(err)
  }
}

export async function materialKfaUpdateRelationXls(req,res, next) {
  const { model, file, schema, dbValidation, dataValidation } = req
  if (file === undefined) {
    return res.status(400).send('Please upload an excel file!')
  }
  const rules = { schema, dbValidation, dataValidation }
  const fullpath = path.join(__dirname, '../../../resources/uploads/') + file.filename

  const trx = await sequelize.transaction()
  try {
    const rows = await readXlsxFile(fullpath, { sheet: 1 }).then((row) => {
      return row
    })
    const columnKeys = rows[0]
    if (!rows[1] || rows[1].length == 0) {
      throw Error('Upload file failed, empty row data')
    }

    let errors = []
    let data = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      let material = {
        material_id: row[columnKeys.indexOf('material_id')],
        code: row[columnKeys.indexOf('code')],
        material_type: row[columnKeys.indexOf('material_type')],
        code_kfa_ingredients: row[columnKeys.indexOf('code_kfa_ingredients')],
        name_kfa_ingredients: row[columnKeys.indexOf('name_kfa_ingredients')],
        code_kfa_product_template: row[columnKeys.indexOf('code_kfa_product_template')],
        name_kfa_product_template: row[columnKeys.indexOf('name_kfa_product_template')],
        code_kfa_product_variant: row[columnKeys.indexOf('code_kfa_product_variant')],
        name_kfa_product_variant: row[columnKeys.indexOf('name_kfa_product_variant')],
      }

      const { error } = await validationSchema(material, rules, data)
      if (error) {
        errors.push({ 0: error.message + ' at row ' + i })
      }

      if (errors.length > 0) {
        fs.unlinkSync(fullpath)
        return res.status(422).json({ errors: errors })
      }

      if (!error) {
        material = {
          id: row[columnKeys.indexOf('material_id')],
          id_material_smile: row[columnKeys.indexOf('material_id')],
          parent_id: row[columnKeys.indexOf('parent_id')],
          code: row[columnKeys.indexOf('code')],
          kfa_code: row[columnKeys.indexOf('code')],
          material_type: row[columnKeys.indexOf('material_type')],
          code_kfa_ingredients: row[columnKeys.indexOf('code_kfa_ingredients')],
          name_kfa_ingredients: row[columnKeys.indexOf('name_kfa_ingredients')],
          code_kfa_product_template: row[columnKeys.indexOf('code_kfa_product_template')],
          name_kfa_product_template: row[columnKeys.indexOf('name_kfa_product_template')],
          code_kfa_product_variant: row[columnKeys.indexOf('code_kfa_product_variant')],
          name_kfa_product_variant: row[columnKeys.indexOf('name_kfa_product_variant')],
          kfa_level_id: getKfaLevelId(row[columnKeys.indexOf('material_type')]),
        }

        data.push(material)
      }
    }

    /* Update master material  */
    const masterMaterialData = data.map((material) => {
      return {
        id: material.id,
        parent_id: material.parent_id,
        code: material.code,
        kfa_code: material.kfa_code,
        kfa_level_id: material.kfa_level_id,
      }
    })

    await models.MasterMaterial.bulkCreate(masterMaterialData, {
      ignoreDuplicates: true,
      updateOnDuplicate: [
        'code', 
        'kfa_code',
        'parent_id',
        'kfa_level_id',
      ],
      transaction: trx,
    })

    /* Update mapping master material */
    const mappingMasterMaterialData = data.map((material) => {
      return {
        id_material_smile: material.id_material_smile,
        code_kfa_ingredients: material.code_kfa_ingredients || null,
        name_kfa_ingredients: material.name_kfa_ingredients || null,
        code_kfa_product_template: material.code_kfa_product_template || null,
        name_kfa_product_template: material.name_kfa_product_template || null,
        code_kfa_product_variant: material.code_kfa_product_variant || null,
        name_kfa_product_variant: material.name_kfa_product_variant || null,
      }
    })

    await Promise.all(
      mappingMasterMaterialData.map(async (data) => {
        const [material, created] = await models.MappingMasterMaterial.findOrCreate({
          where: {
            id_material_smile: data.id_material_smile
          },
          defaults: {
            id_material_smile: data.id_material_smile,
            code_kfa_ingredients: data.code_kfa_ingredients,
            name_kfa_ingredients: data.name_kfa_ingredients,
            code_kfa_product_template: data.code_kfa_product_template,
            name_kfa_product_template: data.name_kfa_product_template,
            code_kfa_product_variant: data.code_kfa_product_variant,
            name_kfa_product_variant: data.name_kfa_product_variant,
          },
          transaction: trx,
        })

        if (!created) {
          await material.update(
            {
              code_kfa_ingredients: data.code_kfa_ingredients,
              name_kfa_ingredients: data.name_kfa_ingredients,
              code_kfa_product_template: data.code_kfa_product_template,
              name_kfa_product_template: data.name_kfa_product_template,
              code_kfa_product_variant: data.code_kfa_product_variant,
              name_kfa_product_variant: data.name_kfa_product_variant,
            }, 
            { transaction: trx }
          )
        }

        return true
      })
    )

    const query = `
        SELECT
            ehmm.entity_id as entity_id,
            mm.parent_id as master_material_id,
            null as deleted_at
        FROM
            entity_has_master_materials ehmm
        JOIN master_materials mm ON
            mm.id = ehmm.master_material_id
        WHERE
            mm.kfa_level_id = ${KFA_LEVEL_ID.VARIANT}
            AND mm.parent_id IS NOT NULL
        GROUP BY
            ehmm.entity_id,
            mm.parent_id;
    `

    const entityMasterMaterialData = await sequelize.query(
      query,
      {
        type: Sequelize.QueryTypes.SELECT,
        transaction: trx
      }
    )

    const stream = await models.EntityMasterMaterial.bulkCreateWithStream(entityMasterMaterialData, {
      isObjectMode: true,
      ignoreDuplicates: true,
      updateOnDuplicate: [
        'deleted_at',
      ],
      transaction: trx,
    })

    stream.on('data', (chunk) => {
      console.log('Chunk Data:', chunk)
    })

    stream.on('end',() => {
      fs.unlinkSync(fullpath)
      trx.commit()
      return res.status(200).json({
        message: 'Uploaded the file successfully: ' + file.filename,
      })
    })
  } catch (error) {
    fs.unlinkSync(fullpath)
    trx.rollback()
    console.log(error)
    return next(error)
  }
}

function getKfaLevelId(type) {
  if (
    type == MATERIAL_KFA_TYPE_XLS.OBAT_PARENT 
    || type == MATERIAL_KFA_TYPE_XLS.ALKES_BMHP_PARENT
  ) {
    return KFA_LEVEL_ID.TEMPLATE
  } else {
    return KFA_LEVEL_ID.VARIANT
  }
}