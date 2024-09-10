import { Op, QueryTypes } from 'sequelize'

import models from '../../../models'

import listResponse from '../../../helpers/listResponse'
import { USER_ROLE, ENTITY_TYPE, KFA_LEVEL_ID } from '../../../helpers/constants'
import { getStockKfaWorkbook, formatStockXLSQuery as stockXLSQuery } from './stockXLSController'
import { onlyUnique, filterLeveling, pagination } from '../../../helpers/common'
import _ from 'lodash'
import moment from 'moment'

export async function filter(req, res, next) {
  try {
    let {
      entity_id,
      province_id,
      regency_id,
      activity_id,
      material_id,
      keyword,
      expired_start_date,
      expired_end_date,
      no_batch,
      batch_ids,
      stock_activity_id,
      sub_district_id,
      entity_tag_id,
      only_have_qty,
      is_vaccine,
      code_satu_sehat,
      code_kfa_ingredients,
      code_kfa_product_template,
      code_kfa_product_variant,
      code_kfa_packaging,
      period_id,
      kfa
    } = req.query

    let andCondition = [],
      materialCondition = [],
      mappingMasterMaterialCondition = [],
      entityCondition = [],
      entityTagCondition = [],
      batchConditon = [],
      activityCondition = {}

    let materialId = []
    if (activity_id) {
      activityCondition = {
        where: { activity_id: activity_id },
      }

      let activityMaterial = await models.MasterActivity.findByPk(activity_id, {
        include: {
          association: 'materials',
          attributes: ['id'],
          required: true,
        },
      })
      if (!activityMaterial) {
        return res.status(204).json({})
      }
      activityMaterial.materials.forEach((material) => {
        materialId.push(material.id)
      })
    }
    if (materialId.length > 0)
      materialCondition.push({ id: { [Op.in]: materialId } })

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

    if (
      req.user.role === USER_ROLE.OPERATOR ||
      req.user.role === USER_ROLE.OPERATOR_COVID
    ) {
      entity_id = req.user.entity_id
    }
    if (entity_id) andCondition.push({ entity_id })
    if (material_id && !kfa) andCondition.push({ master_material_id: material_id })
    if (only_have_qty == 1) andCondition.push({ on_hand_stock: { [Op.gt]: 0 } })
    else if(only_have_qty == 0) andCondition.push({on_hand_stock: {[Op.lte]: 0}})

    if (keyword) materialCondition.push({ name: { [Op.like]: `%${keyword}%` } })
    if (is_vaccine !== null && is_vaccine !== undefined)
      materialCondition.push({ is_vaccine })
  
    if (
      req.user.role === USER_ROLE.MANAGER ||
      req.user.role === USER_ROLE.MANAGER_COVID
    ) {
      if (req.user.entity.type === ENTITY_TYPE.PROVINSI)
        province_id = req.user.entity.province_id
      else if (req.user.entity.type === ENTITY_TYPE.KOTA) {
        province_id = req.user.entity.province_id
        regency_id = req.user.entity.regency_id
      }
    }
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entity_tag_id) entityTagCondition.push({ id: entity_tag_id })

    if (expired_start_date && expired_end_date) {
      batchConditon.push({
        expired_date: {
          [Op.between]: [
            `${expired_start_date} 00:00:00`,
            `${expired_end_date} 23:59:59`,
          ],
        },
      })
    }
    if (no_batch) batchConditon.push({ code: { [Op.like]: `%${no_batch}%` } })
    if (batch_ids) batchConditon.push({ id: { [Op.in]: batch_ids.split(',') } })

    let batchOptions = {},
      entityTagOptions = {},
      entityOptions = {},
      materialOptions = {},
      mappingMasterMaterialOptions = {},
      stockOptions = {},
      mappingEntityOptions = {},
      isRequiredStock = false

    if (batchConditon.length > 0) {
      batchOptions = { where: batchConditon, required: true }
      isRequiredStock = true
    }

    if (code_satu_sehat) {
      mappingEntityOptions = {
        where: { id_satu_sehat: { [Op.in]: code_satu_sehat.split(',') } },
      }
      entityOptions = { required: true }
    }

    if (entityTagCondition.length > 0) {
      entityTagOptions = { where: entityTagCondition, required: true }
      entityOptions = { required: true }
    }
    // if(entityCondition.length > 0) entityOptions = { where: entityCondition }
    if (entityCondition.length > 0)
      entityOptions = { where: entityCondition, required: true }
    if (materialCondition.length > 0)
      materialOptions = { where: materialCondition, required: true }
    if (Object.keys(filteredKfa).length > 0)
      mappingMasterMaterialOptions = {
        where: { [Op.or]: filteredKfa },
        required: true,
      }

    stockOptions = {
      where: [
        {
          [Op.or]: [
            { batch_id: null },
            { '$batch.status$': 1 }
          ]
        }
      ]
    }

    if (stock_activity_id) {
      stockOptions.where.push({ activity_id: stock_activity_id })
      stockOptions.required = true
      /*stockOptions = {
        where:,
        required: true,
      }*/
      isRequiredStock = true
    }

    req.include = [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        ...materialOptions,
        required: true,
        include: [
          {
            association: 'mapping_master_material',
            attributes: models.MappingMasterMaterial.getBasicAttribute(),
            ...mappingMasterMaterialOptions,
          },
        ],
      },
      {
        association: 'entity',
        attributes: models.Entity.getBasicAttribute(),
        include: [
          {
            association: 'mapping_entity',
            attributes: models.MappingEntity.getBasicAttribute(),
            ...mappingEntityOptions,
          },
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
          { association: 'sub_district', attributes: ['id', 'name'] },
          {
            association: 'entity_tags',
            attributes: ['id'],
            ...entityTagOptions,
          },
        ],
        ...entityOptions,
      },
      {
        association: 'stocks',
        attributes: [...models.Stock.getBasicAttributeV2()],
        ...stockOptions,
        include: [
          {
            association: 'batch',
            attributes: models.Batch.getBasicAttribute(),
            include: {
              association: 'manufacture',
              attributes: ['name', 'address'],
            },
            subQuery: true,
            ...batchOptions,
          },
          {
            association: 'activity',
            attributes: models.MasterActivity.getBasicAttribute(),
            paranoid: false,
          },
          {
            association: 'source_material'
          }

        ],
        required: isRequiredStock,
        separate: true,
      },
      {
        association: 'entityMasterMaterialActivities',
        attributes: [
          'min',
          'max',
          'stock_on_hand',
          'allocated',
          'activity_id',
          'updated_at',
        ],
        // ...activityCondition,
        include: [
          {
            association: 'activity',
            attributes: ['name'],
            paranoid: false,
          },
        ],
        separate: true,
      },
    ]


    if (period_id) {
      req.include[0].include.push(
        {
          association: 'new_opname_items',
          order: [['updated_at', 'DESC']],
          separate: true,
          include: {
            association: 'new_opname',
            where: { period_id, entity_id },
            required: true
          }
        }
      )
    }

    if (activity_id) {
      req.include.push({
        association: 'entityMasterMaterialActivitiesFilter',
        attributes: ['id'],
        ...activityCondition,
        required: true,
      })
    }

    req.condition = andCondition

    req.order = [
      [{ model: models.MasterMaterial, as: 'material' }, 'name', 'ASC'],
    ]

    req.customOptions = {
      distinct: 'EntityMasterMaterial.id',
      subQuery: false,
    }

    return next()
  } catch (err) {
    console.error(err)
    return next(err)
  }
}


function mapppingStockKFA(docs) {
  const parentLessEhmm = docs
    .filter((item) => item.dataValues.mapping_master_material == null)
    .map((item) => {
      const { material, min, max, entity_id, entity } =  item.dataValues
      material.dataValues.min = min
      material.dataValues.max = max
      material.dataValues.available_stock = item?.available_stock
      material.dataValues.on_hand_stock = item?.on_hand_stock
      material.dataValues.allocated_stock = item?.allocated_stock
      material.dataValues.stocks = item.dataValues.stocks
      material.dataValues.total_open_vial = item.dataValues.total_open_vial
      material.dataValues.kfa_code = item.material.kfa_code

      return { ...material.dataValues, entity_id, entity }
    })
  const parentLessEhmmGroupByEntity = _.groupBy(parentLessEhmm, 'entity_id')

  let data = []
  docs.forEach(item => {
    const {code_kfa_product_template, material, min, max, entity_id, mapping_master_material} = item.dataValues
    const parentLessMaterial = parentLessEhmmGroupByEntity[entity_id.toString()]

    if (material && mapping_master_material) {
      let index = data.findIndex(it => {
        return it.code_kfa_product_template == code_kfa_product_template && it.entity_id == entity_id
      })
      material.dataValues.min = min
      material.dataValues.max = max
      material.dataValues.available_stock = item?.available_stock
      material.dataValues.on_hand_stock = item?.on_hand_stock
      material.dataValues.allocated_stock = item?.allocated_stock
      material.dataValues.stocks = item.dataValues.stocks
      material.dataValues.total_open_vial = item.dataValues.total_open_vial
      
      if (index >= 0) {
        // update existing 92 property / object
        data[index].min += min
        data[index].max += max
        data[index].available_stock += item.available_stock
        data[index].on_hand_stock += item.on_hand_stock
        data[index].allocated_stock += item.allocated_stock
        data[index].total_open_vial += item.total_open_vial
        data[index].extermination_discard_qty += item.extermination_discard_qty
        data[index].extermination_received_qty += item.extermination_received_qty
        data[index].extermination_shipped_qty += item.extermination_shipped_qty
        data[index].extermination_qty += item.extermination_qty
        data[index].materials.push(material)
      } else {
        // create new 92 property / object
        item.dataValues.materials = [material]
        item.dataValues.parentless_materials = parentLessMaterial || []
        delete item.dataValues.master_material_id
        delete item.dataValues.material_id
        delete item.dataValues.material
        delete item.dataValues.id
        delete item.dataValues.stocks
        delete item.dataValues.entityMasterMaterialActivities
        delete item.dataValues.mapping_master_material
        data.push({available_stock : item.available_stock, ...item.dataValues})
      }
    }
  })

  return { data, parentLessEhmm }
}

function mappingStock(docs, materialCompanions, kfa) {
  let stocks = docs.map((data) => {
    let materialCompanion = materialCompanions.filter(
      (item) => item.master_material_id === data.material_id
    )
    materialCompanion = materialCompanion.map((obj) => {
      return obj.material_companion.dataValues
    })
    let min = 0
    let max = 0
    let { stocks } = data
    if (data.dataValues.material)
      data.dataValues.material.dataValues.material_companion =
        materialCompanion ?? []
    if (data.dataValues) {
      data.dataValues.entityMasterMaterialActivities.forEach((item) => {
        min += item.min
        max += item.max
        item.dataValues.available_stock = item.stock_on_hand - item.allocated
        item.dataValues.activity_name = item.activity?.name ?? ''
        let batchs = []
        for (let stock of stocks.filter(
          (it) => it.activity_id == item.activity_id
        )) {
          let stockdata = stock.batch
          let allocated = stock.dataValues.allocated
          let stock_on_hand = stock.dataValues.qty
          let available_stock = stock.available
          /*if (stockdata) {
            stockdata.dataValues.allocated = allocated
            stockdata.dataValues.stock_on_hand = stock_on_hand
            stockdata.dataValues.available_stock = available_stock
          }*/

          if (stockdata) {
            batchs.push({
              ...stockdata.dataValues,
              allocated: allocated,
              stock_on_hand: stock_on_hand,
              available_stock: available_stock,
            })
          }
        }
        item.dataValues.batchs = batchs
        delete item.dataValues.activity
      })
      data.dataValues.min = min
      data.dataValues.max = max
      delete data.dataValues.entityMasterMaterialActivitiesFilter

      if (kfa == true) {
        const { material } = data
        const { mapping_master_material } = material

        if (data.dataValues.material)
          delete data.dataValues.material.dataValues.mapping_master_material

        data.dataValues.code_kfa_product_template = mapping_master_material?.code_kfa_product_template
        data.dataValues.name_kfa_product_template = mapping_master_material?.name_kfa_product_template
        data.dataValues.mapping_master_material = mapping_master_material
      }
    }

    return data
  })
  
  let parentLessVariantStocks = null
  if (kfa == true) {
    const { data, parentLessEhmm } = mapppingStockKFA(stocks)
    stocks = data
    parentLessVariantStocks = parentLessEhmm
  }

  return { stocks, parentLessVariantStocks }
}

export async function customList(req, res, next) {
  try {
    const { page = 1, paginate = 10, kfa } = req.query
    const { condition = {}, attributes, order, include, customOptions } = req

    let options = {
      order,
      attributes,
      where: condition,
      duplicating: false,
      ...customOptions,
    }

    if (!kfa) {
      options = {
        ...options,
        limit: Number(paginate),
        offset: (page - 1) * Number(paginate),
      }
    }

    if (include && typeof include === 'object') options.include = include
    let docs = []
    let total = 10

    
    docs = await models.EntityMasterMaterial.findAll(options)
    const countOptions = {
      ...options,
      attributes: [],
      having: [],
      // include: formatRelationsCount(options.include, condition),
    }
    
    total = await models.EntityMasterMaterial.count({
      ...countOptions,
      subQuery: false,
    })

    if (Array.isArray(docs) && docs.length <= 0 && !req.isForExportKfa) {
      throw { status: 204, message: req.__('204') }
    }

    let materialIds = docs.map((item) => item.material_id).filter(onlyUnique)
    let materialCompanions = await models.MasterMaterialCompanion.findAll({
      where: { master_material_id: { [Op.in]: materialIds } },
      include: {
        association: 'material_companion',
        attributes: ['id', 'name', 'code', 'description'],
      },
    })
    
    const { stocks, parentLessVariantStocks } = mappingStock(docs, materialCompanions, kfa)
    
    let response = null
    if(kfa == true) {
      const data = pagination(stocks, paginate, page)
      total = stocks.length
      
      response = {
        total: total,
        page: page,
        perPage: paginate,
        list: data
      }
    } else {
      response = listResponse(total, page, paginate, stocks)
    }

    if (req.isForExportKfa) {
      return { stocks, parentLessVariantStocks }
    }
    
    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
}

export async function customList2(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query
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

    docs = await models.EntityMasterMaterial.findAll(options)
    const countOptions = {
      ...options,
      attributes: [],
      having: [],
      // include: formatRelationsCount(options.include, condition),
    }

    total = await models.EntityMasterMaterial.count({
      ...countOptions,
      subQuery: false,
    })
    // return res.status(200).json(listResponse(total, page, paginate, docs))

    let materialIds = docs.map((item) => item.material_id).filter(onlyUnique)
    let materialCompanions = await models.MasterMaterialCompanion.findAll({
      where: { master_material_id: { [Op.in]: materialIds } },
      include: {
        association: 'material_companion',
        attributes: ['id', 'name', 'code', 'description'],
      },
    })

    docs = docs.map((data) => {
      let materialCompanion = materialCompanions.filter(
        (item) => item.master_material_id === data.material_id
      )
      materialCompanion = materialCompanion.map((obj) => {
        return obj.material_companion.dataValues
      })
      let min = 0
      let max = 0
      let { stocks } = data
      if (data.dataValues.material)
        data.dataValues.material.dataValues.material_companion =
          materialCompanion ?? []
      if (data.dataValues) {
        data.dataValues.entityMasterMaterialActivities.forEach((item) => {
          min += item.min
          max += item.max
          item.dataValues.available_stock = item.stock_on_hand - item.allocated
          item.dataValues.activity_name = item.activity?.name ?? ''
          let batchs = []
          for (let stock of stocks.filter(
            (it) => it.activity_id == item.activity_id
          )) {
            let stockdata = stock.batch
            let allocated = stock.dataValues.allocated
            let stock_on_hand = stock.dataValues.qty
            let available_stock = stock.available

            if (stockdata) {
              batchs.push({
                ...stockdata.dataValues,
                allocated: allocated,
                stock_on_hand: stock_on_hand,
                available_stock: available_stock,
              })
            }
          }
          item.dataValues.batchs = batchs
          delete item.dataValues.activity
        })
        data.dataValues.min = min
        data.dataValues.max = max
        delete data.dataValues.entityMasterMaterialActivitiesFilter
      }
      return data
    })

    docs = docs.map(item => {
      let item_stock_on_hand = 0
      let item_allocated = 0
      let item_available_stock = 0

      const itemActivities = item.dataValues.entityMasterMaterialActivities
      item.dataValues.entityMasterMaterialActivities.dataValues = itemActivities.map(itemActivity => {
        let item_act_stock_on_hand = 0
        let item_act_allocated = 0
        let item_act_available_stock = 0

        const itemBatchs = itemActivity.dataValues.batchs
        itemBatchs.forEach(itemBatch => {
          item_act_stock_on_hand += itemBatch.stock_on_hand
          item_act_allocated += itemBatch.allocated
          item_act_available_stock += itemBatch.available_stock
        })
        item_stock_on_hand += item_act_stock_on_hand
        item_allocated += item_act_allocated
        item_available_stock += item_act_available_stock

        itemActivity.dataValues.stock_on_hand = item_act_stock_on_hand
        itemActivity.dataValues.allocated = item_act_allocated
        itemActivity.dataValues.available_stock = item_act_available_stock
        return itemActivity
      })
      item.dataValues.on_hand_stock = item_stock_on_hand
      item.dataValues.allocated_stock = item_allocated
      item.dataValues.available_stock = item_available_stock
      return item
    })
    //next()
    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

export async function logisticFilter(req, res, next) {
  let {
    entity_id,
    province_id,
    regency_id,
    activity_id,
    stock_activity_id,
    material_id,
    expired_start_date,
    expired_end_date,
    batch_ids,
    entity_tag_id,
    is_vaccine,
    only_have_qty,
    page = 1, 
    paginate = 10
  } = req.query

  let
    templateCondition = [],
    variantCondition = [],
    isVaccineCondition = [],
    entityCondition = [],
    entityTagCondition = [],
    batchConditon = []

  if (entity_id) templateCondition.push({ entity_id })
  if (material_id) templateCondition.push({ master_material_id: material_id })

  if (only_have_qty == 1) {
    templateCondition.push({ on_hand_stock: { [Op.gt]: 0 } })
    variantCondition.push({ on_hand_stock: { [Op.gt]: 0 } })
  }
  else if(only_have_qty == 0) {
    templateCondition.push({on_hand_stock: {[Op.lte]: 0}})
    variantCondition.push({on_hand_stock: {[Op.lte]: 0}})
  }

  if (is_vaccine)
    isVaccineCondition.push({ is_vaccine })

  if (
    req.user.role === USER_ROLE.OPERATOR ||
    req.user.role === USER_ROLE.OPERATOR_COVID
  ) {
    entity_id = req.user.entity_id
  }

  if (
    req.user.role === USER_ROLE.MANAGER ||
    req.user.role === USER_ROLE.MANAGER_COVID
  ) {
    if (req.user.entity.type === ENTITY_TYPE.PROVINSI)
      province_id = req.user.entity.province_id
    else if (req.user.entity.type === ENTITY_TYPE.KOTA) {
      province_id = req.user.entity.province_id
      regency_id = req.user.entity.regency_id
    }
  }
  if (province_id) entityCondition.push({ province_id })
  if (regency_id) entityCondition.push({ regency_id })

  if (entity_tag_id) entityTagCondition.push({ id: entity_tag_id })

  if (expired_start_date && expired_end_date) {
    batchConditon.push({
      expired_date: {
        [Op.between]: [
          `${expired_start_date} 00:00:00`,
          `${expired_end_date} 23:59:59`,
        ],
      },
    })
  }
  if (batch_ids) batchConditon.push({ id: { [Op.in]: batch_ids.split(',') } })

  let 
    entityTagOptions = {},
    entityOptions = {},
    stockOptions = {},
    batchOptions = {},
    childMaterialActivityOptions = {},
    isRequiredStock = false
    
  if (batchConditon.length > 0) {
    batchOptions = { where: batchConditon, required: true }
    isRequiredStock = true
  }

  stockOptions = {
    where: [
      {
        [Op.or]: [
          { batch_id: null },
          { '$batch.status$': 1 }
        ]
      }
    ]
  }

  if (activity_id || stock_activity_id) {
    stockOptions.where.push({ activity_id })
    stockOptions.required = true
    isRequiredStock = true
  }

  if (entityTagCondition.length > 0) {
    entityTagOptions = { where: entityTagCondition, required: true }
    entityOptions = { required: true }
  }
    
  if (entityCondition.length > 0)
    entityOptions = { where: entityCondition, required: true }

  if (activity_id || stock_activity_id) {
    childMaterialActivityOptions = {
      include: [
        {
          association: 'children',
          required: true,
          include: [
            { 
              association: 'material_activities',
              where: {
                id: activity_id
              },
              required: true
            }
          ]
        }
      ]
    }
  }

  req.templateOptions = {
    where: [
      ...templateCondition
    ],
    include: [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        required: true,
        where: [
          { kfa_level_id: KFA_LEVEL_ID.TEMPLATE },
          ...isVaccineCondition
        ],
        ...childMaterialActivityOptions
      },
      {
        association: 'entity',
        attributes: models.Entity.getBasicAttribute(),
        include: [
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
          {
            association: 'entity_tags',
            attributes: ['id'],
            ...entityTagOptions,
          },
        ],
        ...entityOptions
      },
    ],
    limit: Number(paginate),
    offset: (page - 1) * Number(paginate),
  }

  req.variantOptions = {
    where: [
      ...variantCondition
    ],
    include: [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        required: true,
        where: [
          { kfa_level_id: KFA_LEVEL_ID.VARIANT },
          ...isVaccineCondition
        ]
      },
      {
        association: 'entity',
        attributes: models.Entity.getBasicAttribute(),
        include: [
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
          {
            association: 'entity_tags',
            attributes: ['id'],
            ...entityTagOptions,
          },
        ],
        ...entityOptions
      },
      {
        association: 'stocks',
        attributes: [...models.Stock.getBasicAttributeV2()],
        ...stockOptions,
        include: [
          {
            association: 'batch',
            attributes: models.Batch.getBasicAttribute(),
            include: {
              association: 'manufacture',
              attributes: ['name', 'address'],
            },
            ...batchOptions,
          },
          {
            association: 'activity',
            attributes: models.MasterActivity.getBasicAttribute(),
          },
          {
            association: 'source_material'
          }
        ],
        required: isRequiredStock,
        separate: true
      },
    ]
  }

  next()
}

export async function logisticList(req, res, next) {
  try {
    const { count, rows } = await models.EntityMasterMaterial.findAndCountAll(req.templateOptions)

    /* Additional options for variant ehmm */
    const templateEhmmEntityIds = rows.map((item) => item.entity_id).filter((value, index, array) => array.indexOf(value) === index)

    req.variantOptions.where.push({
      entity_id: {
        [Op.in]: templateEhmmEntityIds
      }
    })

    const templateEhmmMaterialIds = rows.map((item) => item.master_material_id).filter((value, index, array) => array.indexOf(value) === index)
    
    req.variantOptions.where.push({ 
      '$material.parent_id$': { 
        [Op.in]: templateEhmmMaterialIds 
      } 
    })
    
    const variantEntityMaterials = await models.EntityMasterMaterial.findAll(req.variantOptions)
    
    const result = rows.map((templateEntityMaterialInstance) => {
      const templateEntityMaterial = templateEntityMaterialInstance.get({ plain: true })
        
      const parentLessChildrenEhmm = variantEntityMaterials
        .filter((variantEntityMaterial) => variantEntityMaterial.entity_id === templateEntityMaterial.entity_id && !variantEntityMaterial.material.parent_id)
        
      const childrenEhmm = variantEntityMaterials
        .map((variantEntityMaterialInstance) => {
          const variantEntityMaterial = variantEntityMaterialInstance.get({ plain: true })

          const available_stock = _.sumBy(variantEntityMaterial.stocks, 'available')
          const on_hand_stock = _.sumBy(variantEntityMaterial.stocks, 'qty')
          const allocated_stock = _.sumBy(variantEntityMaterial.stocks, 'allocated')

          return {
            ...variantEntityMaterial,
            available_stock,
            on_hand_stock,
            allocated_stock,
          }
        })
        .filter((variantEntityMaterial) => variantEntityMaterial.entity_id === templateEntityMaterial.entity_id && variantEntityMaterial.material.parent_id === templateEntityMaterial.material.id)

      const available_stock = _.sumBy(childrenEhmm, 'available_stock')
      const on_hand_stock = _.sumBy(childrenEhmm, 'on_hand_stock')
      const allocated_stock = _.sumBy(childrenEhmm, 'allocated_stock')

      return {
        ...templateEntityMaterial,
        available_stock,
        on_hand_stock,
        allocated_stock,
        code_kfa_product_template: templateEntityMaterial.material.kfa_code,
        name_kfa_product_template: templateEntityMaterial.material.name,
        materials: childrenEhmm,
        parentless_materials: parentLessChildrenEhmm
      }
  
    })
  
    return res.status(200).json(listResponse(count, req.query.page, req.query.paginate, result))
  } catch (error) {
    next(error)
  }
}


export async function preDataNewOpname(req, res, next) {
  try {
    const { page = 1, paginate = 10, entity_id } = req.query
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

    docs = await models.EntityMasterMaterial.findAll(options)
    const countOptions = {
      ...options,
      attributes: [],
      having: [],
      // include: formatRelationsCount(options.include, condition),
    }

    total = await models.EntityMasterMaterial.count({
      ...countOptions,
      subQuery: false,
    })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    const materialIds = _.keys(_.groupBy(docs, 'master_material_id'))

    //const rawQuery = `SELECT a.id, a.type, a.vendor_id, a.customer_id, a.activity_id, f.name, b.id as order_item_id, b.confirmed_qty, b.master_material_id, c.stock_id, d.batch_id, e.code, e.expired_date FROM orders a, order_items b, order_stocks c, stocks d, batches e, master_activities f WHERE f.id = a.activity_id AND c.order_item_id = b.id AND b.master_material_id in (:materialId) and b.order_id = a.id and a.customer_id = :customerId AND a.status = 4 and a.type in (1,2,3) and c.deleted_at is NULL and b.deleted_at is NULL and d.id = c.stock_id and e.id = d.batch_id AND f.deleted_at is NULL AND e.status = 1`

    const rawQuery = `SELECT DISTINCT  a.id, b.id as order_item_id, a.type, a.vendor_id, a.customer_id, a.activity_id, f.name, b.id as order_item_id, b.confirmed_qty, b.master_material_id, 
      d.batch_id,e.code, e.expired_date FROM orders a JOIN order_items b ON a.id = b.order_id JOIN order_stocks c ON b.id = c.order_item_id
      JOIN stocks d ON c.stock_id = d.id LEFT JOIN batches e ON d.batch_id = e.id JOIN master_activities f ON a.activity_id = f.id 
      WHERE a.deleted_at is NULL AND c.deleted_at is NULL AND b.deleted_at is NULL and (d.batch_id is NULL OR e.status = 1) AND f.deleted_at is NULL 
      AND a.customer_id  = :customerId and b.master_material_id in (:materialId)  AND a.status = 4 AND a.type in (1,2,3) AND e.deleted_at is NULL 
      ORDER BY a.updated_at DESC`


    const distributionNotReceives = await models.sequelize.query(
      rawQuery,
      {
        replacements: { customerId: entity_id, materialId: materialIds },
        type: QueryTypes.SELECT
      }
    )

    docs = docs.map((data) => {
      let min = 0
      let max = 0
      let { stocks, master_material_id } = data
      let newStocks = []
      if (data.dataValues) {
        const { material } = data.dataValues
        const { new_opname_items } = material
        if (new_opname_items && new_opname_items.length > 0) {
          material.dataValues.is_opname = 1
          material.dataValues.last_opname_date = new_opname_items[0].updated_at

          delete material.dataValues.new_opname_items

          data.dataValues.material = material
        } else material.dataValues.is_opname = 0


        data.dataValues.entityMasterMaterialActivities.forEach((item) => {
          min += item.min
          max += item.max
          item.dataValues.available_stock = item.stock_on_hand - item.allocated
          item.dataValues.activity_name = item.activity?.name ?? ''
          let batchs = []
          for (let stock of stocks.filter(
            (it) => it.activity_id == item.activity_id
          )) {
            let stockdata = stock.batch
            let allocated = stock.dataValues.allocated
            let stock_on_hand = stock.dataValues.qty
            let available_stock = stock.available
            /*if (stockdata) {
              stockdata.dataValues.allocated = allocated
              stockdata.dataValues.stock_on_hand = stock_on_hand
              stockdata.dataValues.available_stock = available_stock
            }*/

            if (stockdata) {
              batchs.push({
                ...stockdata.dataValues,
                allocated: allocated,
                stock_on_hand: stock_on_hand,
                available_stock: available_stock,
              })
            }
          }
          item.dataValues.batchs = batchs
          delete item.dataValues.activity
        })
        data.dataValues.min = min
        data.dataValues.max = max
        delete data.dataValues.entityMasterMaterialActivitiesFilter
        delete data.dataValues.entityMasterMaterialActivities

        let batches = []

        for (let stock of stocks) {
          const { activity_id } = stock
          batches.push({ batch_id: stock.batch_id, activity_id })
          let distributionNotReceiveQty = 0
          let returnNotReceiveQty = 0
          for (let distItem of distributionNotReceives.filter(it => it.master_material_id == master_material_id && it.activity_id == activity_id && it.batch_id == stock.batch_id && (it.type == 1 || it.type == 2))) {
            distributionNotReceiveQty += distItem.confirmed_qty
          }
          for (let distItem of distributionNotReceives.filter(it => it.master_material_id == master_material_id && it.activity_id == activity_id && it.batch_id == stock.batch_id && it.type == 3)) {
            returnNotReceiveQty += distItem.confirmed_qty
          }
          stock.dataValues.unsubmit_distribution_qty = distributionNotReceiveQty
          stock.dataValues.unsubmit_return_qty = returnNotReceiveQty
        }

        let batchNotFound = distributionNotReceives.filter(it => it.master_material_id == master_material_id && batches.findIndex(bt => bt.activity_id == it.activity_id && bt.batch_id == it.batch_id) < 0)

        if (batchNotFound.length > 0) {

          for (let batchItem of batchNotFound) {
            let newStock = {
              available: 0,
              stock_id: null,
              id: null,
              batch_id: batchItem.batch_id,
              activity_id: batchItem.activity_id,
              qty: 0,
              batch: batchItem.batch_id ? {
                id: batchItem.batch_id,
                code: batchItem.code,
                expired_date: batchItem.expired_date
              } : null,
              activity: {
                id: batchItem.activity_id,
                name: batchItem.name
              },
              unsubmit_distribution_qty: 0,
              unsubmit_return_qty: 0
            }

            const index = newStocks.findIndex(it => it.batch_id == batchItem.batch_id && it.activity_id == batchItem.activity_id)
            if (index >= 0) {
              if (batchItem.type == 3) newStocks[index].unsubmit_return_qty += batchItem.confirmed_qty
              else newStocks[index].unsubmit_distribution_qty += batchItem.confirmed_qty
            } else {
              if (batchItem.type == 3) newStock.unsubmit_return_qty += batchItem.confirmed_qty
              else newStock.unsubmit_distribution_qty += batchItem.confirmed_qty
              newStocks.push(newStock)
            }
          }

        }

        delete data.dataValues.stocks
      }

      return {
        ...data?.dataValues,
        stocks: [...stocks, ...newStocks]
      }
    })

    //next()
    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

export const formatStockXLSQuery = async (req, res, next) => {
  const { kfa } = req.query

  if (!kfa) {
    return await stockXLSQuery(req, res, next)
  } else {
    return await stockKfaXLS(req, res, next)
  }
}

async function stockKfaXLS(req, res, next) {
  req.isForExportKfa = true
  const { stocks, parentLessVariantStocks } = await customList(req, res, next)
  req.workbook = (req) => getStockKfaWorkbook({ req, templateStocks: stocks, parentLessVariantStocks })
    
  const formatDate = moment().format('MM-DD-YYYY HH_mm_ss') + ' GMT' + moment().format('ZZ')
  req.xlsFilename = `${req.__('field.export_kfa_stocks.title')} ${formatDate}`
  return next()
}
