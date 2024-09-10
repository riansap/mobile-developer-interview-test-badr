import models from '../models'
import errorResponse from '../helpers/errorResponse'

const { Entity, TransactionType, MaterialTag, MaterialEntity, Material, OrderTag, CustomerVendor } = models

export async function appData(req, res) {
  try {
    const entityID = req.entityID
    var entity = null
    if (entityID) {
      entity = await Entity.findByPk(entityID, {
        include: [
          { association: 'vendors', attributes: ['id', 'name', 'address', 'code', 'status'], through: { attributes: [] }, where: {status: 1} }
        ],
        attributes: ['id', 'name', 'address', 'code']
      })
    }

    const orderTags = await OrderTag.findAll({
      order: [['id', 'ASC']]
    })

    const transactionType = await TransactionType.findAll({
      include: {
        association: 'transaction_reasons',
        attributes: ['id', 'title', 'is_other']
      }
    })
    
    const materialTags = await MaterialTag.findAll({
      attributes: ['id', 'title', 'is_ordered_sales', 'is_ordered_purchase'],
      include: [
        {
          model: Material.scope('active'),
          attributes: Material.getBasicAttribute(),
          through: { attributes: [] },
          as: 'materials',
          include:
          [
            {
              association: 'manufactures',
              attributes: ['id', 'name', 'description'],
              through: { attributes: [] },
            },
            {
              association: 'material_companion', attributes: ['id', 'name', 'code'],
              through: { attributes: [] }
            }
          ]
        },
      ],
      order: [
        ['id', 'ASC'],
        [{model: Material, as: 'materials'}, 'name', 'ASC']
      ]
    })

    const materialEntities = await MaterialEntity.findAll({
      where: {
        entity_id: entityID
      },
      with_stocks: true,
      attributes: ['id', 'material_id', 'on_hand_stock', 'min', 'max', 'allocated_stock', 'available_stock'],
      include: [{
        association: 'stocks',
        attributes: ['id', 'material_entity_id', 'batch_id', 'status', 'qty', 'updatedAt', 'allocated', 'available'],
        include: {
          association: 'batch',
          include: { association: 'manufacture' },
          required: false
        },
        required: false
      },
      {
        association: 'material',
        attributes: ['id', 'managed_in_batch']
      }]
    })
    
    // prepare query to data
    const entityMaterialStock = mappingMaterialTag(materialEntities, materialTags)

    let customerDatas = await CustomerVendor.findAll({ 
      where: { vendor_id: entityID }, 
      include: { association: 'customer', attributes: ['id', 'name', 'address', 'code', 'status'], required: true, where: {status: 1}},
      attributes: ['is_distribution', 'is_consumption']
    })

    let customers = customerDatas
      .filter((item) => item.is_distribution === 1)
      .map((item) => {return item.customer})

    let customer_consumptions = customerDatas
      .filter((item) => item.is_consumption === 1)
      .map((item) => {return item.customer})

    var data = {
      transaction_types: transactionType,
      order_tags: orderTags,
      customers: customers,
      customer_consumptions: customer_consumptions,
      vendors: entity?.vendors || [],
      material_tags: entityMaterialStock
    }
    return res.status(200).json(data)
  } catch (err) {
    console.error(err)
    return res.status(500).json(errorResponse('Internal Server Error'))
  }
}

export async function dataPerEntity(req, res, next) {
  try {
    let { entity_id } = req.query
    if(!entity_id) {
      entity_id = req.entityID
    }
    let materialEntities = await MaterialEntity.findAll({
      where: {
        entity_id: entity_id
      },
      with_stocks: true,
      attributes: ['id', 'material_id', 'on_hand_stock', 'min', 'max', 'allocated_stock', 'available_stock'],
      include: [{
        association: 'material',
        attributes: ['id', 'managed_in_batch'],
      },
      {
        association: 'stocks',
        attributes: ['id', 'material_entity_id', 'batch_id', 'status', 'qty', 'updatedAt', 'allocated', 'available'],
        include: {
          association: 'batch',
          include: { association: 'manufacture' },
          required: false
        },
        required: false
      }]
    }) 
    const materialTags = await MaterialTag.findAll({
      attributes: ['id', 'title', 'is_ordered_sales', 'is_ordered_purchase'],
      include: [
        {
          model: Material.scope('active'),
          attributes: Material.getBasicAttribute(),
          through: { attributes: [] },
          as: 'materials'
        }
      ],
      order: [
        ['id', 'ASC'],
        [{model: Material, as: 'materials'}, 'name', 'ASC']
      ]
    })

    let entityMaterialStock = mappingMaterialTag(materialEntities, materialTags)

    return res.status(200).json({material_tags: entityMaterialStock})

  } catch(err) {
    console.error(err)
    return res.status(500).json(errorResponse('Internal Server Error'))
  }
}

export function mappingMaterialTag(materialEntities, materialTags) {
  let entityMaterialStock = []
  materialTags.forEach(tag => {
    let materials = []
    const { id, title, is_ordered_sales, is_ordered_purchase } = tag
    const materialTagField = {
      id: id, 
      title: title, 
      is_ordered_purchase: is_ordered_purchase, 
      is_ordered_sales: is_ordered_sales
    }
    mappingMaterial(tag.materials, materialEntities, materials)
    entityMaterialStock.push({ ...materialTagField, materials: materials })
  })
  return entityMaterialStock
}

function mappingMaterial(tagMaterials, materialEntities, materials) {
  tagMaterials.forEach(material => {
    let materialEntity = getElementBy(materialEntities, material.id)
    if (materialEntity) {
      let stock = getElementBy(materialEntity.stocks, null, 'batch_id')
      let stockObj = {}
      let stockBatch = material.managed_in_batch ? getBatchByMaterial(materialEntity.stocks) : []
      let lastUpdate = ''
      if (!material.managed_in_batch && stock) {
        stockObj = { stock_id: stock.id, qty: stock.qty, updated_at: stock.updatedAt, allocated: stock.allocated, available: stock.available}
        lastUpdate = stockObj['updated_at']
      } else if (stockBatch[0] !== undefined && stockBatch.length > 0) {
        stockBatch = sortByUpdatedAt(stockBatch)
        lastUpdate = stockBatch[0]['updated_at']
      }
      material.dataValues.available = materialEntity.available_stock ?? 0
      material.dataValues.allocated = materialEntity.allocated_stock ?? 0
      material.dataValues.min = materialEntity.min ?? 0
      material.dataValues.max = materialEntity.max ?? 0
      material.dataValues.updated_at = lastUpdate ?? ''
      material.dataValues.is_batches = material.managed_in_batch ? true : false
      delete material.managed_in_batch
      material.dataValues.batches = stockBatch
      material.dataValues.stock = stockObj
      materials.push(material)
    }
  })
}

function getElementBy(array, material_id, field = 'material_id') {
  var obj = null
  if(Array.isArray(array) && array.length > 0) {
    array.forEach(element => {
      if (element[field] == material_id) {
        obj = element
      }
    })
  }
  return obj
}

function sortByUpdatedAt(batches) {
  return batches.sort(function(a, b) {
    return new Date(b.updated_at) - new Date(a.updated_at)
  })
}

function getBatchByMaterial(array) {
  var batches = []
  if(Array.isArray(array) && array.length > 0) {
    array.forEach(stock => {
      if (stock.batch_id !== null && stock.batch) {
        batches.push({
          id: stock.batch_id,
          stock_id: stock.id,
          qty: stock.qty,
          updated_at: stock.updatedAt,
          status: stock.status,
          allocated: stock.allocated, 
          available: stock.available,
          code: stock.batch.code,
          expired_date: stock.batch.expired_date,
          production_date: stock.batch.production_date,
          manufacture_id: stock.batch.manufacture_id,
          manufacture_name: stock.batch.manufacture_name,
        })
      }
    })
  }
  return batches
}
