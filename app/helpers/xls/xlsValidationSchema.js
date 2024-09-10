import joi, { number } from 'joi'
import models from '../../models'
import { checkEntityCustomer } from '../../controllers/entityController'
import {
  USER_ROLE,
  USER_GENDER,
  ENTITY_TYPE,
  validateMobilePhone,
  KFA_LEVEL_CODE,
  KFA_LEVEL_ID,
} from '../constants'
import errorResponse from '../errorResponse'
import { Op } from 'sequelize'
import {
  saveEntityMasterMaterial,
  saveMappingMasterMaterial,
} from '../../controllers/v2/materialController'

const validateOptions = {
  abortEarly: false,
}

function checkConstant(value, constant) {
  let objVal = Object.values(constant)
  if (objVal.indexOf(Number(value)) === -1) {
    return false
  }
  return true
}

async function checkData(value, Model, condition, exist = true) {
  if (!value) {
    return true
  }

  let values = value.toString().split(',')
  let where = { [condition]: value }
  if (values.length > 1) {
    where = {
      [condition]: { [Op.or]: values },
    }
  }

  let queryModel =
    values.length > 1
      ? models[Model].findAll({ where: where })
      : models[Model].findOne({ where: where })

  let data = await queryModel.then((data) => {
    if (data) {
      if (values.length > 1 && values.length != data.length) return false
      return true
    }
    return false
  })
  if (!exist) data = !data
  return data
}

export function validationDataMultivalues(data, schemas = []) {
  let errors = []
  for (let i = 0; i < schemas.length; i++) {
    let schema = schemas[i]
    let value = data[schema]

    let values = value.split(',')
    for (let val of values) {
      let selected = values.filter((it) => it == val)
      if (selected.length > 1) {
        errors.push(`Data ${schema} is duplicate`)
        break
      }
    }
  }
  if (errors.length > 0) return { message: errors.join(', ') }
  return null
}

export async function validationSchema(data, rules, existDatas = []) {
  const { schema, dataValidation, dbValidation, dataMultivalues } = rules
  if (schema) {
    const { error } = await schema.validate(data, validateOptions)
    if (error) return { error: error }
  }
  if (dataValidation) {
    const errorDuplicate = await checkDuplicate(
      data,
      dataValidation,
      existDatas
    )
    if (errorDuplicate) return { error: errorDuplicate }
  }
  if (dataMultivalues) {
    const errorMulti = validationDataMultivalues(data, dataMultivalues)
    if (errorMulti) return { error: errorMulti }
  }

  if (dbValidation) {
    const errorDB = await checkDBValidation(data, dbValidation)
    if (errorDB) return { error: errorDB }
  }
  return true
}

export async function checkDBValidation(data, schemas = []) {
  let errors = []
  for (let i = 0; i < schemas.length; i++) {
    let schema = schemas[i]
    let isExist = !schema.is_exist ? 'is exists' : 'is not existed'
    let value = data[schema.field]

    let db = await checkData(
      value,
      schema.model,
      schema.attribute,
      schema.is_exist
    )
    if (!db) {
      errors.push(`Data ${schema.model} ${schema.attribute} ${isExist}`)
      // return {message: }
    }
  }
  if (errors.length > 0) return { message: errors.join(', ') }
  return null
}

export function checkDuplicate(data, attributes = [], datas = []) {
  let errors = []
  for (let i = 0; i < attributes.length; i++) {
    let attribute = attributes[i]
    let findData = datas.find((item) => item[attribute] == data[attribute])
    if (findData) {
      errors.push(`Duplicate data ${attribute}`)
      // return { message:  }
    }
  }
  if (errors.length > 0) return { message: errors.join(', ') }
  return null
}

export function userXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      username: joi.string().required(),
      firstname: joi.string().required(),
      lastname: joi.string().allow(null, ''),
      address: joi.string().allow(null, ''),
      password: joi
        .string()
        .required()
        .custom((value) => {
          let reg =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
          if (value.length < 8 || !reg.test(value)) {
            throw new Error(req.__('validator.password', { field: 'password' }))
          }
          return value
        }, 'password'),
      gender: joi
        .number()
        .required()
        .custom((value, helpers) => {
          if (!checkConstant(value, USER_GENDER)) {
            return helpers.error('any.invalid')
          }
          return value
        }),
      date_of_birth: joi.date().allow(null, ''),
      email: joi.string().email({ minDomainSegments: 2 }).required(),
      mobile_phone: joi
        .string()
        .allow(null, '')
        .custom((value) => {
          if (!/^[0-9]+$/.test(value)) {
            throw Error(req.__('validator.number', { field: 'mobile_phone' }))
          }
          if (value.toString().length < 10 || value.toString().length >= 14) {
            throw Error(req.__('custom.phone_length'))
          }
          if (!validateMobilePhone(value)) {
            throw Error(req.__('custom.phone_start_digits'))
          }
          return value
        }),
      role: joi
        .number()
        .required()
        .custom((value, helpers) => {
          if (!checkConstant(value, USER_ROLE)) {
            return helpers.error('any.invalid')
          }
          return value
        }),
      village_id: joi.number().allow(null, ''),
      entity_id: joi.number().required(),
      timezone_id: joi.number().allow(null, ''),
      manufacture_id: joi.when('role', {
        is: USER_ROLE.VENDOR_IOT,
        then: joi.number().required(),
        otherwise: joi.optional(),
      }),
      status: joi.number().required(),
      view_only: joi.number().required().valid(0, 1),
    })
    req.dbValidation = [
      {
        field: 'username',
        model: 'User',
        attribute: 'username',
        is_exist: false,
      },
      { field: 'email', model: 'User', attribute: 'email', is_exist: false },
      { field: 'entity_id', model: 'Entity', attribute: 'id', is_exist: true },
    ]
    req.dataValidation = ['username', 'email']
    req.insertOptions = {
      locale: req.getLocale(),
      subject: req.__('custom.user_created'),
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function entityXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      name: joi.string().required(),
      address: joi.string().required(),
      code: joi.required().custom((value, helpers) => {
        if (!value) {
          return helpers.error('any.invalid')
        }
        return value.toString()
      }),
      province_id: joi.number().required(),
      regency_id: joi.number().allow(null, ''),
      type: joi
        .number()
        .required()
        .custom((value, helpers) => {
          if (!checkConstant(value, ENTITY_TYPE)) {
            return helpers.error('any.invalid')
          }
          return value
        }),
      village_id: joi.number().allow(null, ''),
      region_id: joi.number().allow(null, ''),
      status: joi.number().allow(null, ''),
      post_code: joi.number().allow(null, ''),
      lat: joi.number().allow(null, ''),
      lng: joi.number().allow(null, ''),
      country: joi.string().allow(null, ''),
      sub_district_id: joi.number().allow(null, ''),
      entity_tags: joi.allow(null, ''),
      is_vendor: joi.number().allow(null, ''),
    })
    req.dbValidation = [
      {
        field: 'village_id',
        model: 'Village',
        attribute: 'id',
        is_exist: true,
      },
      { field: 'region_id', model: 'Region', attribute: 'id', is_exist: true },
      { field: 'code', model: 'Entity', attribute: 'code', is_exist: false },
      {
        field: 'province_id',
        model: 'Province',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'regency_id',
        model: 'Regency',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'sub_district_id',
        model: 'SubDistrict',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'entity_tags',
        model: 'EntityTag',
        attribute: 'id',
        is_exist: true,
      },
    ]
    req.dataValidation = ['code']
    req.include = [{ association: 'entity_tags' }]
    req.mappingRelations = async function (data, datas) {
      for (let j = 0; j <= data.length; j++) {
        if (data[j]) {
          await data[j].setEntity_tags(datas[j]['entity_tags'])
        }
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}

export async function entityCustomerXlsSchema(req, res, next) {
  try {
    const { id } = req.params
    const { is_consumption } = req.query

    // check is_vendor
    const data = await models.Entity.findByPk(id)
    if (!data)
      return res.status(400).json(errorResponse('Data tidak ditemukan'))
    if (data.is_vendor !== 1)
      return res
        .status(400)
        .json(
          errorResponse(
            'Data entitas bukan penyedia, tidak bisa menambah pelanggan'
          )
        )

    req.schema = joi.object({
      vendor_id: joi
        .number()
        .required()
        .custom((value, helpers) => {
          if (value !== parseInt(id)) {
            return helpers.error('any.invalid')
          }
          return value
        }),
      customer_id: joi.number().required(),
      customer_name: joi.number().allow(null, ''),
      vendor_name: joi.number().allow(null, ''),
      is_consumption: joi.number().allow(null, ''),
      is_distribution: joi.number().allow(null, ''),
      is_extermination: joi.number().allow(null, ''),
    })

    req.dbValidation = [
      { field: 'vendor_id', model: 'Entity', attribute: 'id', is_exist: true },
      {
        field: 'customer_id',
        model: 'Entity',
        attribute: 'id',
        is_exist: true,
      },
    ]
    req.dataValidation = ['customer_id']

    let deleteCondition = {}

    if (typeof is_consumption !== 'undefined') {
      deleteCondition = { is_distribution: 1, is_extermination: 0 }
      req.additionalValue = [
        { title: 'is_distribution', value: 1 },
        { title: 'is_extermination', value: 1 },
      ]
      if (parseInt(is_consumption)) {
        req.additionalValue = [
          { title: 'is_consumption', value: 1 },
          { title: 'is_distribution', value: 0 },
        ]
        deleteCondition = { is_consumption: 1, is_extermination: 0 }
      }
    }

    req.beforeInsert = async () => {
      await models.CustomerVendor.destroy({
        where: {
          vendor_id: id,
          ...deleteCondition,
        },
      })
    }

    req.customValidation = async ({ datas }) => {
      let customer_id = datas.map((el) => {
        return el.customer_id
      })
      let vendor_id = datas[0].vendor_id
      let is_consumption = datas[0].is_consumption
      let entity = await models.Entity.findByPk(vendor_id)
      let checkCustomer = await checkEntityCustomer(
        customer_id,
        entity,
        is_consumption
      )
      if (checkCustomer !== true) {
        throw Error(checkCustomer)
      }
    }
    req.insertOptions = {
      ignoreDuplicates: true,
    }

    next()
  } catch (err) {
    next(err)
  }
}

export function materialXlsSchema(req, res, next) {
  try {
    const { kfa, kfa_level } = req.body

    req.schema = getMasterMaterialSchema(req)

    req.dbValidation = [
      {
        field: 'code',
        model: 'MasterMaterial',
        attribute: 'code',
        is_exist: false,
      },
      {
        field: 'kfa_code',
        model: 'MasterMaterial',
        attribute: 'kfa_code',
        is_exist: false,
      },
      {
        field: 'manufactures',
        model: 'Manufacture',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'material_activities',
        model: 'MasterActivity',
        attribute: 'id',
        is_exist: true,
      },
    ]

    req.dataMultivalues = ['manufactures']

    if (!kfa || kfa_level == KFA_LEVEL_CODE.VARIANT) {
      req.dataMultivalues.push('material_activities')
    }

    req.dataValidation = ['code', 'kfa_code']

    req.include = [
      { association: 'master_material_has_companion' },
      { association: 'master_material_has_activities' },
      { association: 'master_material_has_manufactures' },
    ]

    if (kfa) {
      req.include.push({ association: 'mapping_master_materials' })
    }

    req.mappingRelations = async function (materialInstances, datas) {
      for (let j = 0; j <= materialInstances.length; j++) {
        if (materialInstances[j]) {
          await materialInstances[j].setManufactures(
            datas[j]['manufactures'].toString().split(',')
          )
          await materialInstances[j].setMaterial_companion(
            datas[j]['material_companion'].toString().split(',')
          )

          if (!kfa || kfa_level == KFA_LEVEL_CODE.VARIANT) {
            await materialInstances[j].setMaterial_activities(
              datas[j]['material_activities'].toString().split(',')
            )
          }

          if (kfa && kfa_level == KFA_LEVEL_CODE.VARIANT) {
            await saveMappingMasterMaterial({ material: materialInstances[j] })
            await saveEntityMasterMaterial({
              material: materialInstances[j],
              user: req.user,
            })
          }
        }
      }
    }

    if (kfa) {
      req.customValidation = async ({ datas }) => {
        for (let index = 0; index < datas.length; index++) {
          const rowData = datas[index]
          const rowIndex = index + 1

          validateKfaCode(req, rowData, rowIndex)

          if (kfa_level == KFA_LEVEL_CODE.VARIANT) {
            await validateKfaLevel(req, rowData, rowIndex)
          }
        }
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}

function validateKfaCode(req, rowData, rowIndex) {
  const { kfa_level } = req.body

  const lengthValid = rowData.kfa_code.length >= 7

  if (!lengthValid)
    throw Error(req.__('validator.kfa_code_length') + ' at row ' + rowIndex)

  if (kfa_level == KFA_LEVEL_CODE.TEMPLATE) {
    const startsWith92 = rowData.kfa_code.startsWith('92')

    if (!startsWith92)
      throw Error(
        req.__('validator.kfa_code_starts_with_92') + ' at row ' + rowIndex
      )
  } else if (kfa_level == KFA_LEVEL_CODE.VARIANT) {
    const startsWith93 = rowData.kfa_code.startsWith('93')

    if (!startsWith93)
      throw Error(
        req.__('validator.kfa_code_starts_with_93') + ' at row ' + rowIndex
      )
  }

  return true
}

async function validateKfaLevel(req, rowData, rowIndex) {
  const parentMasterMaterial = await models.MasterMaterial.findByPk(
    parseInt(rowData.parent_id)
  )
  if (!parentMasterMaterial) {
    throw Error(
      req.__('validator.not_exist', {
        field: 'Parent ' + req.__('field.id.material_id'),
      }) +
        ' at row ' +
        rowIndex
    )
  }

  const kfaLevelChild = await models.KfaLevel.findOne({
    where: {
      id: KFA_LEVEL_ID.VARIANT,
    },
  })
  const kfaLevelParent = await models.KfaLevel.findOne({
    where: {
      id: parentMasterMaterial.kfa_level_id,
    },
  })

  if (kfaLevelChild.order_number <= kfaLevelParent.order_number) {
    throw Error(req.__('validator.kfa_level_hierarchy') + ' at row ' + rowIndex)
  }

  return true
}

function getMasterMaterialSchema(req) {
  const { kfa, kfa_level } = req.body
  if (kfa && kfa_level == KFA_LEVEL_CODE.TEMPLATE) {
    return joi.object({
      name: joi.string().required(),
      description: joi.string().required(),
      pieces_per_unit: joi.number().required(),
      unit: joi.string().required(),
      temperature_sensitive: joi.number().required().valid(0, 1),
      temperature_min: joi.number().required(),
      temperature_max: joi.number().required().min(joi.ref('temperature_min')),
      managed_in_batch: joi.number().required().valid(0, 1),
      kfa_code: joi.string().required(),
      material_companion: joi.allow(null, ''),
      manufactures: joi.string().required(),
      is_vaccine: joi.number().required().valid(0, 1),
      is_addremove: joi.number().required().valid(0, 1),
    })
  } else if (kfa && kfa_level == KFA_LEVEL_CODE.VARIANT) {
    return joi.object({
      name: joi.string().required(),
      description: joi.string().required(),
      pieces_per_unit: joi.number().required(),
      unit: joi.string().required(),
      temperature_sensitive: joi.number().required().valid(0, 1),
      temperature_min: joi.number().required(),
      temperature_max: joi.number().required().min(joi.ref('temperature_min')),
      managed_in_batch: joi.number().required().valid(0, 1),
      kfa_code: joi.string().required(),
      material_companion: joi.allow(null, ''),
      manufactures: joi.string().required(),
      material_activities: joi.string().required(),
      is_vaccine: joi.number().required().valid(0, 1),
      is_addremove: joi.number().required().valid(0, 1),
      parent_id: joi.number().required(),
    })
  } else {
    return joi.object({
      name: joi.string().required(),
      description: joi.string().required(),
      pieces_per_unit: joi.number().required(),
      unit: joi.string().required(),
      temperature_sensitive: joi.number().required().valid(0, 1),
      temperature_min: joi.number().required(),
      temperature_max: joi.number().required().min(joi.ref('temperature_min')),
      managed_in_batch: joi.number().required().valid(0, 1),
      code: joi.string().required(),
      material_companion: joi.allow(null, ''),
      manufactures: joi.string().required(),
      material_activities: joi.string().required(),
      is_vaccine: joi.number().required().valid(0, 1),
      is_addremove: joi.number().required().valid(0, 1),
    })
  }
}

export function materialKfaRelationXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      code: joi.required(),
      material_id: joi.number().required(),
      material_type: joi.required(),
      code_kfa_ingredients: joi.allow('').required(),
      name_kfa_ingredients: joi.allow('').required(),
      code_kfa_product_template: joi.allow('').required(),
      name_kfa_product_template: joi.allow('').required(),
      code_kfa_product_variant: joi.allow('').required(),
      name_kfa_product_variant: joi.allow('').required(),
    })

    req.dataValidation = ['material_id']

    req.dbValidation = [
      {
        field: 'material_id',
        model: 'MasterMaterial',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'parent_id',
        model: 'MasterMaterial',
        attribute: 'id',
        is_exist: true,
      },
    ]

    next()
  } catch (err) {
    next(err)
  }
}

export function masterDataIPVXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      master_material_id: joi.number().required(),
      ipv: joi.number().required(),
      activity_id: number().required(),
      has_ipv: joi
        .number()
        .allow(null, '')
        .custom((value, helpers) => {
          if (value !== 1 && value !== 0) {
            return helpers.error('any.invalid')
          }
          return value
        }),
    })
    req.dbValidation = [
      {
        field: 'master_material_id',
        model: 'MasterMaterial',
        attribute: 'id',
        is_exist: true,
      },
    ]
    req.insertOptions = {
      updateOnDuplicate: ['ipv', 'has_ipv', 'updated_by', 'updated_at'],
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function masterDataRegencyXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      year: joi
        .number()
        .required()
        .custom((value, helpers) => {
          // console.log(value)
          if (value.toString().length !== 4) {
            return helpers.error('any.invalid')
          }
          return value
        }),
      entity_id: joi.number().required(),
      master_target_id: joi.number().required(),
      qty: joi.number().required(),
    })
    req.dbValidation = [
      { field: 'entity_id', model: 'Entity', attribute: 'id', is_exist: true },
      {
        field: 'master_target_id',
        model: 'MasterTarget',
        attribute: 'id',
        is_exist: true,
      },
    ]
    req.insertOptions = {
      updateOnDuplicate: ['qty', 'updated_by', 'updated_at'],
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function masterDataTargetXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      name: joi.string().required(),
    })
    req.dbValidation = [
      {
        field: 'name',
        model: 'MasterTarget',
        attribute: 'name',
        is_exist: false,
      },
    ]
    req.dataValidation = ['name']
    next()
  } catch (err) {
    next(err)
  }
}

export function masterDataDistributionXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      master_material_id: joi.number().required(),
      activity_id: joi.number().required(),
      master_target_id: joi.number().required(),
      qty: joi.number().required(),
    })
    req.dbValidation = [
      {
        field: 'master_material_id',
        model: 'MasterMaterial',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'master_target_id',
        model: 'MasterTarget',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'activity_id',
        model: 'MasterActivity',
        attribute: 'id',
        is_exist: true,
      },
    ]
    req.insertOptions = {
      updateOnDuplicate: ['qty', 'updated_by', 'updated_at'],
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function manufactureXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      name: joi.string().required(),
      type: joi.number().required().valid(1, 2, 3),
      reference_id: joi.string().required(),
      description: joi.allow(null, ''),
      contact_name: joi.allow(null, ''),
      phone_number: joi.number().allow(null, ''),
      email: joi.string().email({ minDomainSegments: 2 }).allow(null, ''),
      address: joi.allow(null, ''),
    })
    req.dbValidation = [
      {
        field: 'name',
        model: 'Manufacture',
        attribute: 'name',
        is_exist: false,
      },
      {
        field: 'reference_id',
        model: 'Manufacture',
        attribute: 'reference_id',
        is_exist: false,
      },
    ]
    req.dataValidation = ['name', 'reference_id']
    req.include = []

    next()
  } catch (err) {
    next(err)
  }
}

export function activityXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      name: joi.string().required(),
      is_ordered_sales: joi.number().required().valid(0, 1),
      is_ordered_purchase: joi.when('is_ordered_sales', {
        is: 0,
        then: joi.number().required().valid(1),
        otherwise: joi.number().required().valid(0, 1),
      }),
    })
    req.dbValidation = [
      {
        field: 'name',
        model: 'MasterActivity',
        attribute: 'name',
        is_exist: false,
      },
    ]
    req.dataValidation = ['name']
    req.include = []

    next()
  } catch (err) {
    next(err)
  }
}

export function volumeMaterialXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      master_material_id: joi.number().required(),
      manufacture_id: joi.number().required(),
      pieces_per_unit: joi.number().required(),
      unit_per_box: joi.number().required(),
      box_length: joi.number().required(),
      box_width: joi.number().required(),
      box_height: joi.number().required(),
    })
    req.dbValidation = [
      {
        field: 'master_material_id',
        model: 'MasterMaterial',
        attribute: 'id',
        is_exist: true,
      },
      {
        field: 'manufacture_id',
        model: 'Manufacture',
        attribute: 'id',
        is_exist: true,
      },
    ]
    req.dataValidation = []

    next()
  } catch (err) {
    next(err)
  }
}
