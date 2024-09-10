import sequelize, { Op, Sequelize, where } from 'sequelize'

import models from '../../models'
import errorResponse from '../../helpers/errorResponse'
import { ORDER_STATUS, STATUS } from '../../helpers/constants'
import { formatRelationsCount } from '../../helpers/common'
import moment from 'moment'
import _ from 'lodash'

async function getOrderTags() {
  const orderTags = await models.OrderTag.findAll({
    order: [['id', 'ASC']]
  })
  return orderTags
}

async function getTransactionTypes() {
  const transactionType = await models.TransactionType.findAll({
    include: {
      association: 'transaction_reasons',
      attributes: ['id', 'title', 'is_other']
    }
  })
  return transactionType
}

async function getCustomers(entityID) {
  const customerVendors = await models.CustomerVendor.findAll({
    where: { vendor_id: entityID },
    attributes: ['is_distribution', 'is_consumption', 'customer_id'],
  })
  let customerIDs = customerVendors.map((item) => { return item.customer_id })

  const customerDatas = await models.Entity.findAll({
    where: [
      { id: { [Op.in]: customerIDs } },
      { status: 1 },
    ],
    attributes: ['id', 'name', 'address', 'code', 'status'],
    include: [{
      association: 'entity_tags',
      attributes: ['id', 'title'],
      through: { attributes: [] },
    }],
  })

  let customerConsumption = []
  let customerDistribution = []
  customerVendors.forEach(custVendor => {
    const data = customerDatas.find(entity => entity.id === custVendor.customer_id)
    if (custVendor.is_consumption) customerConsumption.push(data)
    if (custVendor.is_distribution) customerDistribution.push(data)
  })

  return {
    customerConsumption,
    customerDistribution
  }
}

async function getEntity(entityID) {
  const entity = await models.Entity.findByPk(entityID, {
    include: {
      association: 'vendors',
      attributes: ['id', 'name', 'address', 'code', 'status'],
      through: { attributes: [] },
      where: { status: 1 },
      include: {
        association: 'entity_tags',
        attributes: ['id', 'title'],
        through: { attributes: [] },
      }
    },
    attributes: ['id', 'name', 'address', 'code']
  })
  return entity
}


function mappingEntityMaterial(materialEntityStocks) {
  let materialActivityStocks = []
  materialEntityStocks.forEach(materialEntity => {
    const { material, stocks } = materialEntity
    const activities = material.material_activities ? material.material_activities.map(item => {
      let index = materialEntity.entityMasterMaterialActivities.map(it => it.activity_id).indexOf(item.id)
      let entityMasterAct = index > -1 ? materialEntity.entityMasterMaterialActivities[index].dataValues : {}
      return {
        id: item.id, name: item.name, entity_master_material_activities_id: entityMasterAct.id,
        entity_master_material_id: entityMasterAct.entity_master_material_id,
        consumption_rate: entityMasterAct.consumption_rate, retailer_price: entityMasterAct.retailer_price, tax: entityMasterAct.tax, min: entityMasterAct.min, max: entityMasterAct.max
      }
    }) : []
    delete material.dataValues.material_activities

    materialActivityStocks.push({
      ...material.dataValues,
      available: materialEntity.available_stock ?? 0,
      allocated: materialEntity.allocated_stock ?? 0,
      //entity_master_material_activities : materialEntity.entityMasterMaterialActivities ?? null,
      min: materialEntity.min ?? 0,
      max: materialEntity.max ?? 0,
      updated_at: materialEntity.stock_last_update ?? '',
      is_batches: material.dataValues.managed_in_batch ? true : false,
      activities,
      stocks: stocks.map((stock) => {
        let stockFormatted = {
          ...stock.dataValues,
          available: stock.available,
          close_vial: stock.close_vial,
          created_at: stock.createdAt,
          updated_at: stock.updatedAt
        }
        delete stockFormatted.createdAt
        delete stockFormatted.updatedAt
        return stockFormatted
      })
    })
  })
  return materialActivityStocks
}

async function getEntityMasterMaterial(entityID, activityID = null, query = {}) {
  let { page, paginate } = query
  if (!page || page === '') page = 1
  if (!paginate || paginate === '') paginate = 10

  const materialActivities = {}
  const entityMaterialActivities = {}
  if (activityID) {
    materialActivities.where = [{ id: activityID }]
    materialActivities.required = true

    entityMaterialActivities.where = [{ activity_id: activityID }]
    entityMaterialActivities.required = true
  }

  let options = {
    where: {
      entity_id: entityID
    },
    attributes: models.EntityMasterMaterial.getBasicAttribute(),
    include: [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        where: { status: STATUS.ACTIVE },
        include: [{
          association: 'material_activities',
          ...materialActivities
        }, {
          association: 'manufactures',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] },
        }, {
          association: 'material_companion',
          attributes: ['id', 'name', 'code'],
          through: { attributes: [] }
        }],
      },
      {
        association: 'entityMasterMaterialActivities',
        ...entityMaterialActivities
      },
      {
        association: 'stocks',
        attributes: [...models.Stock.getBasicAttributeV2(), 'activity_id'],
        include: {
          association: 'batch',
          include: { association: 'manufacture', attributes: ['id', 'name', 'production_year', 'production_date'] },
          attributes: ['id', 'code', 'expired_date', 'production_date', 'manufacture_id'],
          required: false,
        },
        required: false,
      },
    ]
  }

  const materialEntityStocks = await models.EntityMasterMaterial.findAll({
    limit: Number(paginate),
    offset: (page - 1) * Number(paginate),
    ...options
  })

  const countOptions = {
    limit: Number(paginate),
    offset: (page - 1) * Number(paginate),
    ...options,
    duplicating: false,
    without_items: true,
    without_comments: true,
    include: options.include,
  }

  let total = await models.EntityMasterMaterial.count({ ...countOptions, subQuery: true })

  return { total: total, page: page, pagination: paginate, materials: mappingEntityMaterial(materialEntityStocks) }
}

async function getStock(entityID, activityID = null) {
  const materialActivities = {}
  if (activityID) {
    materialActivities.where = [{ id: activityID }]
    materialActivities.required = true
  }

  let materialCondition = {status: STATUS.ACTIVE}

  if(process.env.APP_SERVICE === 'logistic')
    materialCondition.kfa_level_id = 3

  let options = {
    where: {
      entity_id: entityID
    },
    attributes: models.EntityMasterMaterial.getBasicAttribute(),
    include: [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        where: materialCondition,
        include: [{
          association: 'material_activities',
          ...materialActivities
        }, {
          association: 'manufactures',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] },
        }, {
          association: 'material_companion',
          attributes: ['id', 'name', 'code'],
          through: { attributes: [] }
        }],
      },
      {
        association: 'stocks',
        attributes: [...models.Stock.getBasicAttributeV2(), 'activity_id'],
        include: {
          association: 'batch',
          include: { association: 'manufacture', attributes: ['id', 'name', 'production_year', 'production_date'] },
          attributes: ['id', 'code', 'expired_date', 'production_date', 'manufacture_id'],
          required: false,
        },
        required: false,
      },
    ]
  }

  const materialEntityStocks = await models.EntityMasterMaterial.findAll(options)


  return mappingMaterialActivityStock(materialEntityStocks)
}

function mappingMaterialActivityStock(materialEntityStocks) {
  let materialActivityStocks = []
  materialEntityStocks.forEach(materialEntity => {
    const { material, stocks } = materialEntity
    const activities = material.material_activities ? material.material_activities.map(item => item.id) : []
    delete material.dataValues.material_activities

    materialActivityStocks.push({
      ...material.dataValues,
      available: materialEntity.available_stock ?? 0,
      allocated: materialEntity.allocated_stock ?? 0,
      //entity_master_material_activities : materialEntity.entityMasterMaterialActivities ?? null,
      min: materialEntity.min ?? 0,
      max: materialEntity.max ?? 0,
      updated_at: materialEntity.stock_last_update ?? '',
      is_batches: material.dataValues.managed_in_batch ? true : false,
      activities,
      stocks: stocks.map((stock) => {
        let stockFormatted = {
          ...stock.dataValues,
          available: stock.available,
          close_vial: stock.close_vial,
          created_at: stock.createdAt,
          updated_at: stock.updatedAt
        }
        delete stockFormatted.createdAt
        delete stockFormatted.updatedAt
        return stockFormatted
      })
    })
  })
  return materialActivityStocks
}

export async function appData(req, res) {
  try {
    const entityID = req.entityID
    const entity = entityID ? await getEntity(entityID) : null

    const currentDateTime = moment()
    const currentDate = currentDateTime.format('YYYY-MM-DD')

    // prepare query to data
    let materialActivities = await models.MasterActivity.findAll({
      include: [
        {
          model: models.Entity,
          as: 'activities_date',
          attributes: [['id', 'entity_id'], 'name'],
          through: {
            model: models.EntityActivityDate,
            attributes: ['id', 'join_date', 'end_date'],
            where: {
              entity_id: entityID,
              join_date: {
                [Op.not]: null
              },
              [Op.or]: [
                {
                  [Op.and]: [
                    {
                      join_date: { [Op.lte]: currentDate }
                    },
                    {
                      end_date: { [Op.gte]: currentDate }
                    }
                  ]
                },
                {
                  [Op.and]: [
                    {
                      end_date: null
                    },
                    {
                      join_date: { [Op.lte]: currentDate }
                    }
                  ]
                }
              ]
            },
            required: true,
          },
          required: true
        },
      ],
      order: [
        [['id', 'ASC']]
      ],
      raw: true,
    })

    materialActivities = materialActivities.map((materialActivity) => {
      const newDoc = {
        ...materialActivity,
        join_date: materialActivity['activities_date.entity_activity_date.join_date'],
        end_date: materialActivity['activities_date.entity_activity_date.end_date'],
      }

      delete newDoc['activities_date.entity_id']
      delete newDoc['activities_date.name']
      delete newDoc['activities_date.entity_activity_date.id']
      delete newDoc['activities_date.entity_activity_date.join_date']
      delete newDoc['activities_date.entity_activity_date.end_date']

      return newDoc
    })

    const masterActivitiesOriginal = await models.MasterActivity.findAll({
      attributes: models.MasterActivity.getBasicAttribute(),
      order: [[['id', 'ASC']]]
    })

    const materialStocks = await getStock(entityID)
    const customerDatas = await getCustomers(entityID)
    const entityMasterMaterialActivities = await getEntityMasterMaterialActivities(entityID)

    var data = {
      transaction_types: await getTransactionTypes(),
      order_tags: await getOrderTags(),
      customers: customerDatas['customerDistribution'],
      customer_consumptions: customerDatas['customerConsumption'],
      vendors: entity?.vendors || [],
      materials: materialStocks,
      master_activities_original: masterActivitiesOriginal,
      material_activities: materialActivities,
      entity_master_material_activities: entityMasterMaterialActivities
    }
    return res.status(200).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json(errorResponse('Internal Server Error'))
  }
}

export async function dataPerEntity(req, res, next) {
  try {
    let { entity_id, activity_id } = req.query
    if (!entity_id) entity_id = req.entityID

    // let materialEntities = await models.EntityMasterMaterial.findAll({
    //   where: {
    //     entity_id: entity_id
    //   },
    //   with_stocks: true,
    //   attributes: ['id', 'master_material_id', 'on_hand_stock', 'min', 'max', 'allocated_stock', 'available_stock'],
    //   include: [{
    //     association: 'material',
    //     attributes: ['id', 'managed_in_batch'],
    //   },
    //   {
    //     association: 'stocks',
    //     attributes: ['id', 'entity_master_material_id', 'activity_id', 'batch_id', 'status', 'qty', 'updatedAt', 'allocated', 'available'],
    //     include: {
    //       association: 'batch',
    //       include: { association: 'manufacture' },
    //       required: false
    //     },
    //     required: false
    //   }]
    // }) 

    // let entityMaterialStock = mappingMaterialTag(materialEntities, materialTags)
    let materialStocks = await getEntityMasterMaterial(entity_id, activity_id, req.query)

    return res.status(200).json(materialStocks)

  } catch (err) {
    console.error(err)
    return res.status(500).json(errorResponse('Internal Server Error'))
  }
}

async function getEntityMasterMaterialActivities(entityID) {
  let materialCondition = {status : STATUS.ACTIVE}
  if(process.env.APP_SERVICE === 'logistic')
    materialCondition.kfa_level_id = 3

  let entityMaterial = await models.EntityMasterMaterial.findAll({
    where: { entity_id: entityID },
    include: [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        where: materialCondition
      },
      {
        association: 'entityMasterMaterialActivities',
        include: [{
          association: 'activity'
        }]
      },
    ]
  })

  let data = []

  for (let item of entityMaterial) {
    for (let itm of item.entityMasterMaterialActivities) {
      data.push({
        ...itm.dataValues,
        material: item.dataValues.material
      })
    }
  }

  return data
}


export async function appNotif(req, res, next) {
  try {
    const entityID = req.entityID

    const edStocks = await getStockEd(entityID)
    const orderNotReceived = await getOrderNotReceived(entityID)
    const assetExcursion = await getAssetExcursion(entityID)

    const coldStorage = await getColdstorageOvercapacity(entityID)

    return res.status(200).json({
      ...edStocks,
      ...orderNotReceived,
      asset_excursion: assetExcursion.length,
      coldstorage_overcapacity: coldStorage?.percentage_capacity || 0
    })
  } catch (err) {
    next(err)
  }
}

async function getAssetExcursion(entityID) {
  const assetExcursion = await models.AssetIot.findAll({
    where: [
      { [Op.or]: [{ temp: { [Op.lt]: Sequelize.col('min_temp') } }, { temp: { [Op.gt]: Sequelize.col('max_temp') } }] },
      { entity_id: entityID }
    ]
  })

  return assetExcursion
}

async function getColdstorageOvercapacity(entityID) {
  const coldStorage = await models.Coldstorage.findOne({
    attributes: ['percentage_capacity'],
    where: { entity_id: entityID, percentage_capacity: { [Op.gt]: 80 } }
  })

  return coldStorage
}

async function getStockEd(entityID) {

  const now = moment().format('YYYY-MM-DD') + ' 00:00:00'
  const next30 = moment().add(30, 'days').format('YYYY-MM-DD') + ' 23:59:59'
  const edStocks = await models.Stock.findAll({
    attributes: models.Stock.getBasicAttributeV2(),
    include: [
      {
        association: 'batch',
        where: {
          expired_date: { [Op.lte]: next30 }
        },
        required: true
      },
      {
        association: 'activity',
        attributes: ['id', 'name'],
        required: true
      },
      {
        association: 'entity_master_material',
        include: {
          association: 'material',
          attributes: ['id', 'name']
        },
        where: { entity_id: entityID },
        required: true
      }
    ],
    where: { qty: { [Op.gt]: 0 } }
  })

  let data_notif = {
    ed_stock: {
      total: 0,
      total_material: 0,
      activities: []
    },
    near_ed_stock: {
      total: 0,
      total_material: 0,
      activities: []
    },
    combine_ed_near_ed_stock: {
      total: 0,
      total_material: 0,
      activities: []
    }
  }

  let time_now = new Date(now).getTime()

  for (let item of edStocks) {
    const { batch } = item

    const expired_time = new Date(batch.expired_date).getTime()

    if (expired_time <= time_now) {
      mappingActivityMaterialStock(data_notif.ed_stock, item)
    } else {
      mappingActivityMaterialStock(data_notif.near_ed_stock, item)
    }

    mappingActivityMaterialStock(data_notif.combine_ed_near_ed_stock, item)
  }

  return data_notif

}

function mappingActivityMaterialStock(data, item) {
  const { activity_id, qty, activity, entity_master_material } = item
  const { material, master_material_id } = entity_master_material

  let index = _.findIndex(data.activities, { activity_id: activity_id })

  data.total += qty

  if (index >= 0) {
    data.activities[index].total += qty

    let idx = _.findIndex(data.activities[index].master_materials, { master_material_id: master_material_id })

    if (idx >= 0) {
      data.activities[index].master_materials[idx].total += qty
    } else {
      data.total_material += 1
      data.activities[index].master_materials.push({
        master_material_id,
        name: material.name,
        total: qty
      })
    }
  } else {
    data.total_material += 1
    data.activities.push({
      activity_id: activity_id,
      name: activity?.name,
      total: qty,
      master_materials: [
        {
          master_material_id,
          name: material.name,
          total: qty
        }
      ]
    })
  }
}


async function getOrderNotReceived(entityID) {
  const orders = await models.Order.findAll({
    attributes: ['id', 'customer_id', 'vendor_id'],
    where: [{
      [Op.or]: [{ customer_id: entityID }, { vendor_id: entityID }]
    },
    { status: 4 },
    { type: [1, 2, 3] },
    { activity_id: { [Op.not]: null } }
    ]
  })

  var as_vendor = orders.filter(it => it.vendor_id == entityID).length
  var as_customer = orders.filter(it => it.customer_id == entityID).length

  const data_notif_order = {
    order_not_received: {
      total: as_vendor + as_customer,
      as_vendor,
      as_customer
    }
  }

  return data_notif_order
}