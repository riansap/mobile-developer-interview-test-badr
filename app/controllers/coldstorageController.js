//import { Op } from 'sequelize'
import models from '../models'
import { formatRelationsCount } from '../helpers/common'
import { commonLists, exportExcelColdStorageDetail, exportExcelColdStorageDetailDinkes } from '../helpers/xls/excelTemplate'
import listResponse from '../helpers/listResponse'
import moment from 'moment'
import stream from 'stream'
//import { getSmileHeader } from '../helpers/integrations/smileIntegrationHelper'
import { publishWorker } from '../helpers/services/rabbitmqHelper'
import { generateCapacityNotification } from '../helpers/notifications/coldstorageNotification'
import { Op, Sequelize } from 'sequelize'

/*const ADMIN_USER = process.env.ADMIN_USER
const ADMIN_PASS = process.env.ADMIN_PASS*/
const SMILE_URL = process.env.SMILE_URL

export async function createColdStorage(entity_id, master_material_id, req = {}) {
  try {
    //const headers = await getSmileHeader(ADMIN_USER, ADMIN_PASS)
    const headers = { timezone: 'Asia/Jakarta', Authorization: req.headers.authorization }
    const url = `${SMILE_URL}/coldstorage/transaction`
    const payload = {
      url,
      method: 'POST',
      headers: headers,
      data: {
        entity_id, master_material_id
      },
    }

    publishWorker('http-worker', payload)
  } catch (err) {
    console.log(err)
  }
}

export async function filter(req, res, next) {
  try {
    const condition = []
    let having = []
    const entityCondition = []
    let {
      province_id,
      regency_id,
      entity_id,
      entity_tag_id,
      status_capacity
    } = req.query

    let entityOptions = {}
    if (province_id)
      entityCondition.push({ province_id })
    if (regency_id)
      entityCondition.push({ regency_id })


    if (entity_id)
      condition.push({ entity_id })

    status_capacity = status_capacity ? String(status_capacity).split(',') : null
    if (status_capacity) {
      having.push({ 'status_capacity': { [Op.in]: status_capacity } })
    }

    if (entityCondition.length > 0)
      entityOptions = { where: entityCondition, required: true }

    req.include = [
      {
        association: 'entity',
        attributes: models.Entity.getBasicAttribute(),
        order: [[{ model: models.Entity, as: 'entity' }, 'province_id', 'asc'], [{ model: models.Entity, as: 'entity' }, 'type', 'asc']],
        required: true,
        ...entityOptions
      }
    ]

    if (entity_tag_id) {
      req.include[0].include = [{
        association: 'entity_tags',
        attributes: ['id'],
        through: { attributes: [] },
        where: { id: entity_tag_id },
        required: true
      }]
      req.include[0].required = true
      //condition.push({ '$entity.entity_tags.id$': entity_tag_id })
    }

    req.condition = condition
    req.having = having

    //req.order = [['$entity.id', 'desc']]
    req.order = [[{ model: models.Entity, as: 'entity' }, 'type', 'asc'], [{ model: models.Entity, as: 'entity' }, 'province_id', 'asc'], [{ model: models.Entity, as: 'entity' }, 'regency_id', 'asc']]
    // req.order = [['entity', Sequelize.col('province_id'), 'ASC']]

    return next()

  } catch (error) {
    return next(error)
  }
}

export async function customList(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const { condition = {}, having = {}, include, order } = req

    let attributes = models.Coldstorage.getBasicAttribute()
    attributes = [
      ...attributes,
      [
        Sequelize.literal(`
          CASE 
            WHEN percentage_capacity BETWEEN 1 AND 19 THEN 1
            WHEN percentage_capacity BETWEEN 20 AND 80 THEN 2
            WHEN percentage_capacity > 80 THEN 3
            WHEN percentage_capacity = 0 THEN 4
            ELSE 0
          END
        `),
        'status_capacity'
      ]
    ]

    const options = {
      attributes,
      order,
      limit: Number(paginate),
      offset: (Number(page) - 1) * Number(paginate),
      where: condition,
      having: having,
      duplicating: false,
      subQuery: false
    }

    if (include && typeof include === 'object') options.include = include

    const docs = await models.Coldstorage.findAll(options)
    const countOptions = {
      ...options,
      include: formatRelationsCount(options.include, condition),
    }

    delete countOptions.order
    delete countOptions.limit
    delete countOptions.offset

    const docsTotal = await models.Coldstorage.findAll(countOptions)
    const total = docsTotal.length

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (error) {
    console.log(error)
    return next(error)
  }
}

function mappingDetail(data) {
  const { entity, coldstorage_materials } = data
  let { assets } = entity
  data.assets = assets
  delete entity.dataValues.assets

  assets = assets.map((asset) => {
    const { asset_model, other_capacity_gross, other_capacity_nett } = asset

    delete asset.dataValues.asset_model
    delete asset.dataValues.asset_status
    return {
      ...asset.dataValues,
      capacity_gross: asset_model ? asset_model?.capacity_gross : other_capacity_gross,
      capacity_nett: asset_model ? asset_model?.capacity_nett : other_capacity_nett
    }

  })
  return {
    ...data.dataValues,
    entity,
    assets,
    coldstorage_materials
  }
}

function mappingDetailColdstoragePerMaterial(data) {
  let { coldstorage_per_temperature, assets, coldstorage_materials } = data

  coldstorage_per_temperature = coldstorage_per_temperature.map(item => {
    const itemPerTemperature = item.dataValues
    const rangeTemperature = itemPerTemperature.range_temperature.dataValues

    itemPerTemperature.assets = []
    itemPerTemperature.coldstorage_materials = []

    for (const asset of assets) {
      const assetType = asset.asset_type.dataValues
      if (assetType.min_temp === rangeTemperature.min_temp && assetType.max_temp === rangeTemperature.max_temp) {
        itemPerTemperature.assets.push(asset)
      }
    }

    for (const material of coldstorage_materials) {
      if (!material.dataValues.master_material.dataValues.range_temperature_id) continue
      const materialRangeTemp = material.dataValues.master_material.dataValues.range_temperature.dataValues
      if (materialRangeTemp.min_temp === rangeTemperature.min_temp && materialRangeTemp.max_temp === rangeTemperature.max_temp) {
        itemPerTemperature.coldstorage_materials.push(material)
      }
    }

    return itemPerTemperature
  })

  return {
    ...data,
    coldstorage_per_temperature,
  }
}

export async function detail(req, res, next) {
  try {
    const id = req.params.id
    const path = req.path

    const condition = {}
    if (path.includes('entity')) condition.entity_id = id
    else condition.id = id

    let data = await models.Coldstorage.findOne({
      where: condition,
      include: [
        {
          association: 'entity',
          attributes: models.Entity.getBasicAttribute(),
          include: [
            {
              association: 'assets',
              attributes: ['id', 'name', 'serial_number', 'status', 'other_capacity_nett', 'other_capacity_gross'],
              include: [
                {
                  association: 'asset_model',
                  attributes: ['id', 'name', 'capacity_gross', 'capacity_nett']
                },
                {
                  association: 'asset_type',
                  attributes: ['id', 'name', 'min_temp', 'max_temp', 'is_coldstorage'],
                  where: { is_coldstorage: 1 },
                  required: true
                },
                {
                  association: 'asset_status',
                  attributes: ['id', 'name', 'is_coldstorage'],
                  where: { is_coldstorage: 1 },
                  required: true
                }
              ],

              where: { status: 1 },
              required: false
            }
          ]
        },
        {
          association: 'coldstorage_materials',
          attributes: models.ColdstorageMaterial.getBasicAttribute(),
          where: { dosage_stock: { [Op.gt]: 0 } },
          required: false,
          include: [
            {
              association: 'master_material',
              attributes: ['id', 'name', 'code', 'pieces_per_unit', 'unit', 'status', 'bpom_code', 'kfa_code', 'is_vaccine', 'range_temperature_id'],
              include: [
                {
                  association: 'range_temperature',
                  attributes: [['temperature_min', 'min_temp'], ['temperature_max', 'max_temp']]
                }
              ],
              where: { is_vaccine: 1 }
            }
          ]
        },
        {
          association: 'coldstorage_per_temperature',
          attributes: models.ColdstoragePerTemperature.getBasicAttribute(),
          include: [
            {
              association: 'range_temperature',
              attributes: [['temperature_min', 'min_temp'], ['temperature_max', 'max_temp']]
            },
          ]
        }
      ]
    })

    if (!data)
      throw { status: 204, message: req.__('204') }

    data = mappingDetail(data)

    if (path.includes('xls')) {
      let workbook = null
      if ([1,2].includes(data.entity.type)) {
        workbook = exportExcelColdStorageDetailDinkes(data)
      } else {
        workbook = exportExcelColdStorageDetail(data)
      }
      const filename = `${req.__('coldstorage.detail')} ${Date()}`

      const arrayBuffer = await workbook.xlsx.writeBuffer()

      const readStream = new stream.PassThrough()
      readStream.end(arrayBuffer)
      res.writeHead(200, {
        'Content-Length': arrayBuffer.length,
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
        'Access-Control-Expose-Headers': 'Filename',
        Filename: `${filename}.xlsx`,
      })

      return readStream.pipe(res)
    }

    data = mappingDetailColdstoragePerMaterial(data)

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}


export async function exportXLS(req, res, next) {
  try {
    const { condition = {}, include, order } = req

    const options = {
      attributes: models.Coldstorage.getBasicAttribute(),
      order,
      where: condition,
      duplicating: false,
      subQuery: false
    }

    include[0].include = [
      ...include[0].include || [],
      {
        association: 'assets',
        attributes: ['id', 'name', 'serial_number', 'status', 'other_capacity_nett', 'other_capacity_gross'],
        include: [
          {
            association: 'asset_model',
            attributes: ['id', 'name', 'capacity_gross', 'capacity_nett']
          },
          {
            association: 'asset_type',
            attributes: ['id', 'name', 'is_coldstorage'],
            where: { is_coldstorage: 1 },
            required: true
          },
          {
            association: 'asset_status',
            attributes: ['id', 'name', 'is_coldstorage'],
            where: { is_coldstorage: 1 },
            required: true
          }
        ],

        where: { status: 1 },
        required: false
      }
    ]

    if (include && typeof include === 'object') {
      include[0].include.push({
        association: 'province',
        attributes: ['id', 'name']
      })
      include[0].include.push({
        association: 'regency',
        attributes: ['id', 'name']
      })
      options.include = include
    }
    let docs = await models.Coldstorage.findAll(options)

    let columns = [
      { key: 'entity_name', title: 'Entity Name' },
      { key: 'entity_id', title: 'Entity ID' },
      { key: 'province_name', title: 'Province' },
      { key: 'regency_name', title: 'Regency' },
      { key: 'assets', title: 'Assets' },
      { key: 'volume_asset', title: 'Asset Volume' },
      { key: 'total_volume', title: 'Total Volume' },
      { key: 'percentage_capacity', title: 'Percentage Capacity' },
      { key: 'last_updated', title: 'Last Updated' }
    ]

    let data = []

    for (let item of docs) {
      const { entity, volume_asset, total_volume, percentage_capacity, updated_at } = item
      const { assets, province, regency } = entity

      let Assets = []
      for (let ast of assets) Assets.push(ast.name || ast.serial_number)

      data.push({
        entity_name: entity?.name || '',
        entity_id: item.entity_id,
        province_name: province?.name || '',
        regency_name: regency?.name || '',
        assets: Assets.join(','),
        volume_asset,
        total_volume,
        percentage_capacity,
        last_updated: moment(updated_at).format('YYYY-MM-DD HH:mm:ss')
      })
    }

    const workbook = commonLists(data, columns)
    const filename = `Cold Storages ${Date()}`

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const readStream = new stream.PassThrough()
    readStream.end(arrayBuffer)
    res.writeHead(200, {
      'Content-Length': arrayBuffer.length,
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      'Access-Control-Expose-Headers': 'Filename',
      Filename: `${filename}.xlsx`,
    })

    return readStream.pipe(res)

  } catch (err) {
    return next(err)
  }
}

export async function updateFromTransaction(req, res, next) {
  const t = await models.sequelize.transaction()

  try {

    const { entity_id, master_material_id } = req.body

    await processDataColdstorage(entity_id, master_material_id, t)

    await t.commit()

    return res.status(200).json({ message: 'success' })

  } catch (err) {
    await t.rollback()
    return next(err)
  }
}


export async function processPreviousData(req, res, next) {
  const t = await models.sequelize.transaction()

  try {
    let coldstorageLogs = await models.ColdstorageTransactionLog.findAll({ where: { status: 0 } })

    for (let coldLog of coldstorageLogs) {
      const { entity_id, master_material_id } = coldLog
      await processDataColdstorage(entity_id, master_material_id, t)
    }

    await t.commit()
    return res.status(200).json({ message: 'Done', data: coldstorageLogs })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

async function processDataColdstorage(entity_id, master_material_id, t) {
  const rangeMaterialData = await models.RangeTemperature.findAll({ raw: true })

  let coldStorage = await models.Coldstorage.findOne({
    where: { entity_id },
    transaction: t,
    lock: true
  })

  let Assets = await models.AssetIot.findAll({
    attributes: ['id', 'type_id', 'name', 'serial_number', 'status', 'other_capacity_nett', 'other_capacity_gross'],
    include: [
      {
        association: 'asset_model',
        attributes: ['id', 'name', 'capacity_gross', 'capacity_nett']
      },
      {
        association: 'asset_type',
        attributes: ['id', 'min_temp', 'max_temp'],
        where: { is_coldstorage: 1 },
        required: true
      },
      {
        association: 'asset_status',
        attributes: ['id', 'name'],
        where: { is_coldstorage: 1 },
        required: true
      }
    ],
    where: { entity_id, status: 1 }
  })

  let volume_asset = 0
  let total_volume = 0
  let percentage_capacity = 0
  let projection_volume_asset = 0
  let projection_total_volume = 0
  let projection_percentage_capacity = 0

  // untuk coldstorage per range temperature
  let dataPerTemperatures = []
  const dataPerTemperatureJSON = {}
  const rangeMaterialJSON = {}
  rangeMaterialData.map(item => {
    rangeMaterialJSON[`${item.temperature_min}_${item.temperature_max}`] = item.id
  })

  for (let asset of Assets) {
    const { asset_model, other_capacity_nett } = asset
    let capacity = (asset_model ? asset_model?.capacity_nett : other_capacity_nett) || 0
    volume_asset += capacity
  }
  projection_volume_asset = volume_asset

  let prevCapacity = 0

  if (!coldStorage) {
    coldStorage = await models.Coldstorage.create({
      entity_id,
      volume_asset,
      total_volume,
      percentage_capacity,
      projection_volume_asset,
      projection_total_volume,
      projection_percentage_capacity,
    }, { transaction: t })

    await createColdstorageMaterials(coldStorage, null, t)
  } else if (master_material_id) {


    let coldStorageMaterial = await models.ColdstorageMaterial.findOne({
      where: { coldstorage_id: coldStorage.id, master_material_id }
    })

    if (!coldStorageMaterial) {
      await createColdstorageMaterials(coldStorage, master_material_id, t)
    } else {

      let entityMaterial = await models.EntityMasterMaterial.findOne({
        where: {
          master_material_id,
          entity_id,
        },
        include: [{
          association: 'material'
        },
        {
          association: 'stocks',
          include: {
            association: 'batch',
            required: true
          }
        },
        {
          association: 'entityMasterMaterialActivities',
          attributes: ['min', 'max']
        },
        ]
      })
      entityMaterial = entityMaterial || {}

      let { stocks = [], entityMasterMaterialActivities = [] } = entityMaterial

      let volume_box = 0
      coldStorageMaterial.dosage_stock = 0
      coldStorageMaterial.vial_stock = 0
      coldStorageMaterial.package_stock = 0
      coldStorageMaterial.package_volume = 0
      coldStorageMaterial.volume_per_liter = 0
      coldStorageMaterial.max_dosage = 0
      coldStorageMaterial.recommend_order_base_on_max = 0
      coldStorageMaterial.projection_stock = 0
      coldStorageMaterial.projection_vial_stock = 0
      coldStorageMaterial.projection_package_stock = 0
      coldStorageMaterial.projection_package_volume = 0

      for (let i = 0; i < stocks.length; i++) {
        let stock = stocks[i]

        coldStorageMaterial.dosage_stock += stock.qty

        let manufacture_id = stock?.batch?.manufacture_id

        let volumeMaterial = await models.MasterVolumeMaterialManufacture.findOne({
          where: { master_material_id, manufacture_id }
        })

        if (volumeMaterial) {
          let {
            pieces_per_unit: box_vial,
            unit_per_box: box_volume,
            box_length,
            box_width,
            box_height
          } = volumeMaterial
      
          if (box_vial) coldStorageMaterial.vial_stock += Number((stock.qty / box_vial).toFixed(2))      
          volume_box = ((box_length * box_width * box_height) / 1000)
          coldStorageMaterial.volume_per_liter = volume_box
      
          if (box_vial && box_volume) {
            coldStorageMaterial.package_stock += Number(((stock.qty / box_vial) / box_volume))
            coldStorageMaterial.package_volume += Number((volume_box * ((stock.qty / box_vial) / box_volume)).toFixed(2))
          }
        }
      }
      coldStorageMaterial.package_stock = Math.ceil(coldStorageMaterial.package_stock)

      coldStorageMaterial.remain_package_fulfill = 0 //coldStorageMaterial.package_volume ? (coldStorageMaterial.package_stock / coldStorageMaterial.package_volume) * 100 : 100

      for (const item of entityMasterMaterialActivities) {
        coldStorageMaterial.max_dosage += item.max
      }
      coldStorageMaterial.recommend_order_base_on_max = coldStorageMaterial.max_dosage > entityMaterial.on_hand_stock ? coldStorageMaterial.max_dosage - entityMaterial.on_hand_stock : 0
      coldStorageMaterial.projection_stock = coldStorageMaterial.recommend_order_base_on_max + coldStorageMaterial.dosage_stock

      let volumeMaterialProjection = await models.MasterVolumeMaterialManufacture.findOne({
        where: { master_material_id },
        order: [['created_at', 'DESC']]
      })
      if (volumeMaterialProjection) {
        if (volumeMaterialProjection.pieces_per_unit) {
          coldStorageMaterial.projection_vial_stock = coldStorageMaterial.projection_stock / volumeMaterialProjection.pieces_per_unit
        }
    
        if (volumeMaterialProjection.unit_per_box) {
          coldStorageMaterial.projection_package_stock = coldStorageMaterial.projection_vial_stock / volumeMaterialProjection.unit_per_box
        } 
    
        coldStorageMaterial.projection_package_volume = (coldStorageMaterial.projection_package_stock * volumeMaterialProjection.box_length * volumeMaterialProjection.box_width * volumeMaterialProjection.box_height) / 1000
      }

      await coldStorageMaterial.save({ transaction: t })
    }
  }

  //set default data per temperature and coldstorage id is exist
  rangeMaterialData.map(item => {
    dataPerTemperatureJSON[item.id] = {
      coldstorage_id: coldStorage.id,
      entity_id,
      range_temperature_id: item.id,
      volume_asset: 0,
      total_volume: 0,
      percentage_capacity: 0,
      projection_volume_asset: 0,
      projection_total_volume: 0,
      projection_percentage_capacity: 0,
    }
  })

  for (let asset of Assets) {
    const { asset_model, other_capacity_nett, asset_type } = asset
    let capacity = (asset_model ? asset_model?.capacity_nett : other_capacity_nett) || 0
    // calc volume asset per temperature
    if (rangeMaterialJSON[`${asset_type?.min_temp}_${asset_type?.max_temp}`]) {
      const rangeMaterialID = rangeMaterialJSON[`${asset_type?.min_temp}_${asset_type?.max_temp}`]
      dataPerTemperatureJSON[rangeMaterialID].volume_asset += capacity
      dataPerTemperatureJSON[rangeMaterialID].projection_volume_asset += capacity
    }
  }

  prevCapacity = coldStorage.percentage_capacity

  let coldStorageMaterials = await models.ColdstorageMaterial.findAll({
    where: { coldstorage_id: coldStorage.id },
    include: [{
      association: 'master_material',
      where: { is_vaccine: 1 },
      required: true
    }],
    transaction: t
  })

  coldStorage.total_volume = 0
  coldStorage.projection_total_volume = 0
  coldStorage.volume_asset = volume_asset
  coldStorage.projection_volume_asset = projection_volume_asset
  for (let item of coldStorageMaterials) {
    coldStorage.total_volume += item.package_volume
    coldStorage.projection_total_volume += item?.projection_package_volume || 0
    // calc total volume per temperature
    if (item.master_material.range_temperature_id) {
      // console.log(dataPerTemperatureJSON[item.master_material.range_temperature_id])
      dataPerTemperatureJSON[item.master_material.range_temperature_id].total_volume += item.package_volume
      dataPerTemperatureJSON[item.master_material.range_temperature_id].projection_total_volume += item.projection_package_volume || 0
    }
  }

  dataPerTemperatures = Object.values(dataPerTemperatureJSON).map(item => {
    const percentageCapacity = item.volume_asset ? (item.total_volume / item.volume_asset * 100) : 0
    const projectionPercentageCapacity = item.projection_volume_asset ? (item.projection_total_volume / item.projection_volume_asset * 100) : 0
    return {
      ...item,
      percentage_capacity: Number(percentageCapacity.toFixed(2)),
      projection_percentage_capacity: Number(projectionPercentageCapacity.toFixed(2))
    }
  })

  coldStorage.total_volume = Number((coldStorage.total_volume).toFixed(2))
  coldStorage.projection_total_volume = Number((coldStorage.projection_total_volume).toFixed(2))

  coldStorage.percentage_capacity = coldStorage.volume_asset ? (coldStorage.total_volume / coldStorage.volume_asset * 100) : 0
  coldStorage.percentage_capacity = Number(coldStorage.percentage_capacity.toFixed(2))
  coldStorage.projection_percentage_capacity = coldStorage.projection_volume_asset ? (coldStorage.projection_total_volume / coldStorage.projection_volume_asset * 100) : 0
  coldStorage.projection_percentage_capacity = Number(coldStorage.projection_percentage_capacity.toFixed(2))
  // console.log(coldStorage)
  // console.log(dataPerTemperatures)

  for (let item of coldStorageMaterials) {
    //let {volume_asset, total_volume} = coldStorage
    //let {package_stock, package_volume} = item
    let remain_package_fulfill = 0
    if (item.volume_per_liter)
      remain_package_fulfill = Math.floor((coldStorage.volume_asset - coldStorage.total_volume) / (item.volume_per_liter))
    else if (item.package_stock && item.package_volume)
      remain_package_fulfill = Math.floor((coldStorage.volume_asset - coldStorage.total_volume) / (item.package_volume / item.package_stock))

    await models.ColdstorageMaterial.update({ remain_package_fulfill }, { where: { id: item.id }, transaction: t })
  }
  await coldStorage.save({ transaction: t })

  if (coldStorage.percentage_capacity > 80 && prevCapacity < 80)
    await generateCapacityNotification(coldStorage)

  if (master_material_id)
    await models.ColdstorageTransactionLog.update({ status: 1 }, { where: { entity_id, master_material_id }, transaction: t })

  // set save or update coldstorage per temeprature
  const processBulk = []
  for (const item of dataPerTemperatures) {
    const isExist = await models.ColdstoragePerTemperature.findOne({
      attributes: ['id'],
      where: { coldstorage_id: item.coldstorage_id, entity_id: item.entity_id, range_temperature_id: item.range_temperature_id }
    })
    if (isExist) {
      processBulk.push(models.ColdstoragePerTemperature.update(item, { where: { id: isExist.id }, transaction: t }))
    } else {
      processBulk.push(models.ColdstoragePerTemperature.create(item, { transaction: t }))
    }
  }
  await Promise.all(processBulk)
}

async function createColdstorageMaterials(coldStorage, master_material_id, t) {

  const { id: coldstorage_id, entity_id } = coldStorage
  let condition = { entity_id }
  if (master_material_id) condition.master_material_id = master_material_id
  const entityMaterials = await models.EntityMasterMaterial.findAll({
    where: condition,
    include: [
      {
        association: 'material',
        where: { is_vaccine: 1 },
        required: true
      },
      {
        association: 'entityMasterMaterialActivities',
        attributes: ['min', 'max']
      },
      {
        association: 'stocks',
        include: {
          association: 'batch',
          required: true
        }
      }
    ]
  })

  for (let i = 0; i < entityMaterials.length; i++) {
    let entityMaterial = entityMaterials[i]
    let { stocks, on_hand_stock } = entityMaterial

    let dosage_stock = 0
    let vial_stock = 0
    let package_stock = 0
    let package_volume = 0
    let remain_package_fulfill = 0
    let master_material_id = entityMaterial?.master_material_id
    let max_dosage = 0
    let recommend_order_base_on_max = 0
    let projection_stock = 0
    let projection_vial_stock = 0
    let projection_package_stock = 0
    let projection_package_volume = 0

    let volume_box = 0

    for (let j = 0; j < stocks.length; j++) {
      let stock = stocks[j]

      dosage_stock += stock.qty

      let manufacture_id = stock?.batch?.manufacture_id

      let volumeMaterial = await models.MasterVolumeMaterialManufacture.findOne({
        where: { master_material_id, manufacture_id }
      })

      if (volumeMaterial) {
        let { pieces_per_unit: box_vial, unit_per_box: box_volume, box_length, box_width, box_height } = volumeMaterial
    
        // Ensure vial_stock only calculated if box_vial is non-zero
        if (box_vial) vial_stock += Number((stock.qty / box_vial).toFixed(2))
    
        // Ensure package_stock only calculated if box_volume is non-zero
        if (box_volume) package_stock += vial_stock / box_volume
    
        // Calculate volume_box
        volume_box += ((box_length * box_width * box_height) / 1000)
      }
    
      // Ensure package_stock is rounded up
      package_stock = Math.ceil(package_stock)

    }

    for (const item of entityMaterial.entityMasterMaterialActivities) {
      max_dosage += item.max
    }
    recommend_order_base_on_max = max_dosage > on_hand_stock ? max_dosage - on_hand_stock : 0
    projection_stock = recommend_order_base_on_max + dosage_stock

    let volumeMaterialProjection = await models.MasterVolumeMaterialManufacture.findOne({
      where: { master_material_id },
      order: [['created_at', 'DESC']]
    })

    if (volumeMaterialProjection) {
      if (volumeMaterialProjection.pieces_per_unit) {
        projection_vial_stock = projection_stock / volumeMaterialProjection.pieces_per_unit
      }
  
      if (volumeMaterialProjection.unit_per_box) {
        projection_package_stock = projection_vial_stock / volumeMaterialProjection.unit_per_box
      }
  
      projection_package_volume = (projection_package_stock * volumeMaterialProjection.box_length * volumeMaterialProjection.box_width * volumeMaterialProjection.box_height) / 1000
  
    }
    package_volume = Number((volume_box * package_stock).toFixed(2))

    remain_package_fulfill = 0

    await models.ColdstorageMaterial.create({
      coldstorage_id,
      entity_id,
      master_material_id,
      dosage_stock,
      vial_stock,
      package_stock,
      package_volume,
      remain_package_fulfill,
      volume_per_liter: volume_box,
      max_dosage,
      recommend_order_base_on_max,
      projection_stock,
      projection_vial_stock,
      projection_package_stock,
      projection_package_volume
    }, { transaction: t })
  }
}