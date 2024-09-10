import { Op } from 'sequelize'
import models from '../../../models'

import {
  DEVICE_TYPE,
  TRANSACTION_TYPE,
  USER_ROLE,
} from '../../../helpers/constants'
import { formatRelationsCount, filterLeveling, doDecrypt } from '../../../helpers/common'
import listResponse from '../../../helpers/listResponse'
import { exportExcel as transactionXLS } from './transactionXLSController'
import moment from 'moment'

export async function filter(req, res, next) {
  try {
    const isDiscard = req.url.split('?')[0].includes('transactions-discard')

    const condition = []
    const {
      keyword,
      material_id,
      transaction_type_id,
      start_date,
      end_date,
      vendor_id,
      activity_id,
      transaction_reason_id,
      customer_id,
      is_consumption,
      is_distribution,
      is_order,
      order_type,
      entity_tag_id,
      customer_tag_id,
      is_vaccine,
      start_deleted_date,
      end_deleted_date,
      code_satu_sehat,
      code_kfa_ingredients,
      code_kfa_product_template,
      code_kfa_product_variant,
      code_kfa_packaging,
      patient_id,
      vaccine_sequence
    } = req.query
    let { entity_id, province_id, regency_id, sub_district_id } = req.query

    const { is_deleted } = req

    const whereCustomerVendor = {}
    if (is_consumption) whereCustomerVendor.is_consumption = is_consumption
    else if (is_distribution)
      whereCustomerVendor.is_distribution = is_distribution

    if (is_order === '1') {
      condition.push({ order_id: { [Op.not]: null } })
    } else if (is_order === '0') {
      condition.push({ order_id: { [Op.is]: null } })
    }

    if (vaccine_sequence)
      condition.push({
        vaccine_sequence: vaccine_sequence.split(',')
          .map((item) => item.trim()).filter((item) => item != '')
      })

    const mappingMasterMaterialCondition = []

    if (code_kfa_ingredients) {
      mappingMasterMaterialCondition.push({
        code_kfa_ingredients: {
          [Op.in]: code_kfa_ingredients
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== ''),
        },
      })
    }

    if (code_kfa_product_template) {
      mappingMasterMaterialCondition.push({
        code_kfa_product_template: {
          [Op.in]: code_kfa_product_template
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== ''),
        },
      })
    }

    if (code_kfa_product_variant) {
      mappingMasterMaterialCondition.push({
        code_kfa_product_variant: {
          [Op.in]: code_kfa_product_variant
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== ''),
        },
      })
    }

    if (code_kfa_packaging) {
      mappingMasterMaterialCondition.push({
        code_kfa_packaging: {
          [Op.in]: code_kfa_packaging
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== ''),
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

    let entityTag
    let customerTag = {},
      mappingEntityOptions = {}

    if (entity_tag_id) {
      entityTag = {
        include: {
          association: 'entity_tags',
          attributes: ['id'],
          through: { attributes: [] },
        },
      }
    }
    if (customer_tag_id) {
      customerTag = {
        include: {
          association: 'entity_tags',
          attributes: ['id'],
          through: { attributes: [] },
        },
      }
    }

    if (code_satu_sehat) {
      mappingEntityOptions = {
        where: { id_satu_sehat: { [Op.in]: code_satu_sehat.split(',') } },
      }
    }


    const mappingMasterMaterialInclude = {
      association: 'mapping_master_material',
      attributes: models.MappingMasterMaterial.getBasicAttribute(),
      //separate: true
    }

    if (mappingMasterMaterialCondition.length > 0) {
      mappingMasterMaterialInclude.where = filteredKfa
    }

    req.include = [
      {
        association: 'stock',
        attributes: models.Stock.getBasicAttributeV2(),
        include: [
          {
            association: 'batch',
            attributes: models.Batch.getBasicAttribute(),
            include: {
              association: 'manufacture',
              attributes: ['id', 'name', 'address'],
            },
          },
          {
            association: 'entity_master_material',
            attributes: models.EntityMasterMaterial.getBasicAttribute(),
          },
          {
            association: 'activity',
            attributes: ['id', 'name'],
            paranoid: false,
          },
        ],
      },
      {
        association: 'entity',
        attributes: ['id', 'name', 'address'],
        include: [
          {
            association: 'mapping_entity',
            attributes: models.MappingEntity.getBasicAttribute(),
            ...mappingEntityOptions,
          },
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
        ],
        ...entityTag,
        paranoid: false,
        required: true
      },
      {
        association: 'master_material',
        attributes: [
          'id',
          'name',
          'is_vaccine',
          'is_openvial',
          'managed_in_batch',
        ],
        required: true,
        include: [mappingMasterMaterialInclude],
      },
      {
        association: 'activity',
        attributes: ['id', 'name'],
        paranoid: false,
      },
      {
        association: 'customer',
        attributes: ['id', 'name'],
        ...customerTag,
      },
      {
        association: 'vendor',
        attributes: ['id', 'name'],
      },
      {
        association: 'transaction_type',
        attributes: models.TransactionType.getBasicAttribute(),
      },
      {
        association: 'transaction_reason',
        attributes: ['id', 'title', 'is_other', 'is_purchase'],
      },
      {
        association: 'user_created',
        attributes: ['id', 'username', 'firstname', 'lastname'],
        paranoid: false,
      },
      {
        association: 'user_updated',
        attributes: ['id', 'username', 'firstname', 'lastname'],
        paranoid: false,
      },
      {
        association: 'order',
        attributes: ['id', 'type', 'status', 'status_label'],
      },
      {
        association: 'injection',
        attributes: ['id', 'dose_1', 'dose_2', 'dose_booster', 'dose_routine'],
      },
      {
        association: 'transaction_purchase',
        attributes: [
          'id',
          'source_material_id',
          'year',
          'price',
          'pieces_purchase_id',
        ],
        include: [
          {
            association: 'source_material',
            attributes: ['id', 'name'],
            paranoid: false,
          },
          {
            association: 'pieces_purchase',
            attributes: ['id', 'name'],
            paranoid: false,
          },
        ],
      },
      {
        association: 'patient',
        attributes: await models.Patient.getBasicAttribute()
      },
      {
        association: 'transaction_patients',
        separate: true,
        include: {
          association: 'patient',
          attributes: await models.Patient.getBasicAttribute()
        }
      }
    ]
    if (JSON.stringify(whereCustomerVendor) !== '{}') {
      req.include.push({
        association: 'customer_vendor',
        where: whereCustomerVendor,
      })
    }

    const role = Number(req.user.role)
    const onlySelfRole = [
      USER_ROLE.OPERATOR,
      USER_ROLE.OPERATOR_COVID,
      USER_ROLE.PKC,
    ]
    const deviceType = req.headers['device-type']
      ? DEVICE_TYPE[req.headers['device-type']]
      : DEVICE_TYPE.web
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN) {
      const currentEntity = req.user.entity
      if (!province_id) province_id = currentEntity.province_id
      if (!regency_id) regency_id = currentEntity.regency_id
      if (!sub_district_id) sub_district_id = currentEntity.sub_district_id

      if (onlySelfRole.includes(role) || deviceType === DEVICE_TYPE.mobile) {
        entity_id = req.entityID
      }
      if (role === USER_ROLE.PKC) {
        entity_id = req.query.entity_id
      }
    }

    const entityCondition = []
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entityCondition.length > 0) {
      req.include[1].where = entityCondition
    }

    if (material_id) condition.push({ master_material_id: material_id })

    if (isDiscard) {
      condition.push({ transaction_type_id: TRANSACTION_TYPE.DISCARDS })
    } else {
      if (transaction_type_id) {
        let transactionTypeIds = String(transaction_type_id).split(',')
        transactionTypeIds = transactionTypeIds.map((item) =>
          Number(String(item).trim())
        )
        if (transactionTypeIds)
          condition.push({ transaction_type_id: transactionTypeIds })
      }
    }

    if (keyword)
      condition.push({
        '$master_material.name$': { [Op.like]: `%${keyword}%` },
      })
    if (entity_tag_id)
      condition.push({ '$entity.entity_tags.id$': entity_tag_id })
    if (customer_tag_id)
      condition.push({ '$customer.entity_tags.id$': customer_tag_id })
    if (transaction_reason_id) condition.push({ transaction_reason_id })
    if (vendor_id) condition.push({ vendor_id })
    if (customer_id) condition.push({ customer_id })
    if (start_date) {
      condition.push({ createdAt: { [Op.gte]: moment(start_date).format('YYYY-MM-DD 00:00:00') } })
    } else {
      condition.push({ createdAt: { [Op.gte]: moment().subtract(1, 'days').format('YYYY-MM-DD 00:00:00') } })
    }
    if (end_date) {
      condition.push({ createdAt: { [Op.lte]: moment(end_date).format('YYYY-MM-DD 23:59:59') } })
    } else {
      condition.push({ createdAt: { [Op.lte]: moment().format('YYYY-MM-DD 23:59:59') } })
    }
    if (entity_id) condition.push({ entity_id })
    if (activity_id) condition.push({ activity_id })
    if (order_type) condition.push({ '$order.type$': order_type })
    if (is_vaccine)
      condition.push({ '$master_material.is_vaccine$': is_vaccine })
    if (start_deleted_date)
      condition.push({ deleted_at: { [Op.gte]: start_deleted_date } })
    if (end_deleted_date)
      condition.push({ deleted_at: { [Op.lte]: end_deleted_date } })

    if (patient_id) condition.push({ patient_id: patient_id })

    if (JSON.stringify(condition) !== '{}') req.condition = condition
    req.order = [['id', 'desc']]
    req.customOptions = { subQuery: false }
    //req.customOptions = {}
    if (is_deleted) {
      condition.push({ deleted_at: { [Op.not]: null } })
      req.customOptions.paranoid = false
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function customList(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query
    let checkParam = 0
    for (var key in req.query) {
      if (
        key !== 'page' &&
        key !== 'paginate' &&
        key !== 'size' &&
        key !== 'lang'
      ) {
        if (req.query[key] !== '') {
          checkParam++
        }
      }
    }
    if (checkParam === 0) {
      throw { status: 204, message: req.__('204') }
    }
    const { condition = {}, attributes, order, include, customOptions } = req

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
    let docs = []
    let total = 10

    docs = await models.TransactionLast3Month.findAll(options)
    const countOptions = {
      ...options,
      include: formatRelationsCount(options.include, condition),
    }
    // include master_material & activity relations
    countOptions.include = [
      options.include[2],
      options.include[3],
      ...countOptions.include,
    ]
    total = await models.TransactionLast3Month.count({ ...countOptions, subQuery: false })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    //const virtual = models.TransactionLast3Month.getVirtualAttribute()
    docs = docs.map((data) => {
      const { patient, vaccine_sequence, transaction_patients } = data
      /*let newData = {
        ...data.dataValues,
      }
      virtual.forEach((v) => (newData[v] = data[v]))
      */
      data.material = data.master_material
      data.patient_id = patient ? doDecrypt(patient.nik) : ''
      data.dataValues.vaccine_sequence_name = vaccine_sequence ? req.__(`rabies_vaccine.${vaccine_sequence}`) : ''
      data.transaction_patients = transaction_patients.map((tp)=>{
        tp.patient_id  = tp?.patient ? doDecrypt(tp?.patient?.nik) : ''
        tp.dataValues.vaccine_sequence_name = req.__(`rabies_vaccine.${tp?.vaccine_sequence}`)
        return tp
      })
      delete data.master_material
      return data
    })

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

export const exportExcel = transactionXLS
