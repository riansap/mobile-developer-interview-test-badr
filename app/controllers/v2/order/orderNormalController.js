import moment from 'moment'
import { Op, QueryTypes } from 'sequelize'
import {
  DEVICE_TYPE, ORDER_STATUS,
} from '../../../helpers/constants'
import { getCanvasTrackingUrl, getCanvasUrl, getLastPosition } from '../../../helpers/integrations/easyGoHelper'

import models from '../../../models'

import { createComment } from './orderCommentController'
import _, { isArray } from 'lodash'

const sequelize = models.sequelize

async function getStockFromEntity(materialID, entityID, activityId = null) {
  let conditionEMMA = {}
  if (activityId) conditionEMMA = { activity_id: activityId }

  let stock
  if (isArray(materialID)) {
    stock = await models.EntityMasterMaterial.findAll({
      where: {
        entity_id: entityID,
        master_material_id: materialID
      },
      include: {
        association: 'entityMasterMaterialActivities',
        where: conditionEMMA,
        attributes: [
          'min',
          'max',
          'stock_on_hand',
          'allocated',
          'activity_id',
          'updated_at',
        ],
      }
    })
  } else {
    stock = await models.EntityMasterMaterial.findOne({
      where: {
        entity_id: entityID,
        master_material_id: materialID
      },
      include: {
        association: 'entityMasterMaterialActivities',
        where: conditionEMMA,
        attributes: [
          'min',
          'max',
          'stock_on_hand',
          'allocated',
          'activity_id',
          'updated_at',
        ],
      }
    })
  }
  if (!stock) {
    return null
  }
  return !isArray(materialID) ? {
    id: stock.id,
    min: stock.min,
    max: stock.max,
    entity_id: stock.entity_id,
    on_hand_stock: stock.on_hand_stock,
    available_stock: stock.available_stock,
    allocated_stock: stock.allocated_stock,
    stock_update: stock.stock_last_update,
    entity_master_material_activities: stock.entityMasterMaterialActivities
  } : stock
}

function formatOrderStock(order_stocks) {
  let order_stock_fulfill = []
  order_stocks = order_stocks.map((order_stock) => {
    const { stock = {}, id: orderStockID, order_stock_purchase } = order_stock
    const { batch = {}, id: stockID } = stock

    const batchId = batch?.id || null
    const formatStock = {
      status: order_stock?.status || null,
      order_item_id: order_stock?.order_item_id || null,
      allocated_qty: order_stock?.allocated_qty || 0,
      received_qty: order_stock?.received_qty || null,
      ordered_qty: order_stock?.ordered_qty || null,
      qty: stock.qty || null,
      batch_id: batchId,
      batch: (batch === null || batch === undefined) ? null : {
        id: batch?.id || null,
        code: batch?.code || null,
        expired_date: batch?.expired_date || null,
        production_date: batch?.production_date || null,
        manufacture_name: batch?.manufacture_name || null,

        /* updated for new API UNICC*/
        year: order_stock_purchase?.year || null,
        price: order_stock_purchase?.price || null,
        total_price: order_stock_purchase?.total_price || null,
        source_material_id: order_stock_purchase?.source_material_id || null,
        source_material_name: order_stock_purchase?.source_material?.name || '',
        pieces_purchase_id: order_stock_purchase?.pieces_purchase_id || null,
        pieces_purchase_name: order_stock_purchase?.pieces_purchase?.name || ''
      },
    }

    // group fulfill by batch id, sum all activity
    const indexStockFulfill = order_stock_fulfill.findIndex((item) => item.batch_id === batchId)
    if (indexStockFulfill < 0) {
      order_stock_fulfill.push({
        ...formatStock,
        order_stock_ids: [orderStockID]
      })
    } else {
      order_stock_fulfill[indexStockFulfill].qty += formatStock.qty
      order_stock_fulfill[indexStockFulfill].allocated_qty += formatStock.allocated_qty
      order_stock_fulfill[indexStockFulfill].received_qty += formatStock.received_qty
      order_stock_fulfill[indexStockFulfill].ordered_qty += formatStock.ordered_qty
      order_stock_fulfill[indexStockFulfill].order_stock_ids.push(orderStockID)
    }

    return {
      id: order_stock.id,
      stock_id: order_stock.stock_id,
      activity_id: stock.activity_id || null,
      activity_name: stock.activity_name || null,
      ...formatStock
    }
  })
  return {
    order_stocks,
    order_stock_fulfill
  }
}

async function getConfirmationStock(order, master_material_id) {
  let materialOnConfirmation = 0
  if (order.status === ORDER_STATUS.PENDING) {
    materialOnConfirmation = await models.OrderItem.sum('qty', {
      include: [{
        association: 'order',
        attributes: []
      }],
      where: [
        { master_material_id },
        { '$order.vendor_id$': order.vendor_id },
        { '$order.status$': ORDER_STATUS.CONFIRMED }
      ],
      subQuery: false
    })
  }
  return materialOnConfirmation
}

async function mappingDetail({ order, req }) {
  let purpose = null
  const user = req.user
  if (user) {
    const { vendor_id, customer_id } = order
    if (customer_id === user.entity_id) purpose = 'purchase'
    else if (vendor_id === user.entity_id) purpose = 'sales'
  }

  let { order_items = [], order_items_kfa = [] } = order
  let formattedOrderItems = []
  for (let order_item of order_items) {
    let { order_stocks = [] } = order_item
    let { order_stocks: order_stock_formatted, order_stock_fulfill } = formatOrderStock(order_stocks)

    let data = order_item.dataValues
    data.stock_vendor = await getStockFromEntity(data.master_material_id, order.vendor_id, order.activity_id)
    // set min max stock vendor by emma
    let min = 0, max = 0
    for (const item of data.stock_vendor?.entity_master_material_activities ?? []) {
      min += item.min
      max += item.max
    }
    if (data.stock_vendor) {
      data.stock_vendor.min = min
      data.stock_vendor.max = max
    }


    data.stock_customer = await getStockFromEntity(data.master_material_id, order.customer_id, order.activity_id)
    if (data.stock_vendor) {
      data.stock_vendor.confirmation_stock = await getConfirmationStock(order, data.master_material_id)
    }
    data.material = data.master_material
    data.material_id = data.master_material_id
    delete data.master_material
    delete data.master_material_id
    formattedOrderItems.push({
      ...data,
      allocated: order_item.allocated,
      shipped: order.status === ORDER_STATUS.SHIPPED ? order_item.allocated : 0,
      not_yet_shipped: order.status === ORDER_STATUS.ALLOCATED ? order_item.allocated : 0,
      order_stocks: order_stock_formatted,
      order_stock_fulfill,
    })
  }

  let data_order_items = []
  if (process.env.APP_SERVICE === 'logistic') {
    if (order_items_kfa.length > 0) {
      for (let item of order_items_kfa) {
        let newData = {
          ...item.dataValues,
          name_kfa_product_template: item.name_kfa_product_template,
          children: formattedOrderItems.filter(it => it?.order_item_kfa_id == item.id)
        }
        delete newData.mapping_master_material

        newData.stock_vendor = {
          min: 0,
          max: 0,
          on_hand_stock: 0,
          available_stock: 0,
          allocated_stock: 0
        }

        newData.stock_customer = {
          min: 0,
          max: 0,
          on_hand_stock: 0,
          available_stock: 0,
          allocated_stock: 0
        }

        if (newData.children.length == 0) {
          let mappingMaterials = await models.MappingMasterMaterial.findAll({
            where: { code_kfa_product_template: newData.code_kfa_product_template }
          })
          let materialIds = _.keys(_.groupBy(mappingMaterials, 'id_material_smile'))
          let stock_vendor = await getStockFromEntity(materialIds, order.vendor_id, order.activity_id) || []
          let stock_customer = await getStockFromEntity(materialIds, order.customer_id, order.activity_id) || []
          stock_vendor.forEach(itm => {
            newData.stock_vendor.min += itm.min
            newData.stock_vendor.max += itm.max
            newData.stock_vendor.on_hand_stock += itm.on_hand_stock
            newData.stock_vendor.available_stock += itm.available_stock
            newData.stock_vendor.allocated_stock += itm.allocated_stock
          })

          stock_customer.forEach(itm => {
            newData.stock_customer.min += itm.min
            newData.stock_customer.max += itm.max
            newData.stock_customer.on_hand_stock += itm.on_hand_stock
            newData.stock_customer.available_stock += itm.available_stock
            newData.stock_customer.allocated_stock += itm.allocated_stock
          })
        } else {
          newData.children.forEach(childItem => {
            const { stock_vendor, stock_customer } = childItem
            newData.stock_vendor.min += stock_vendor?.min || 0
            newData.stock_vendor.max += stock_vendor?.max || 0
            newData.stock_vendor.on_hand_stock += stock_vendor?.on_hand_stock || 0
            newData.stock_vendor.available_stock += stock_vendor?.available_stock || 0
            newData.stock_vendor.allocated_stock += stock_vendor?.allocated_stock || 0

            newData.stock_customer.min += stock_customer?.min || 0
            newData.stock_customer.max += stock_customer?.max || 0
            newData.stock_customer.on_hand_stock += stock_customer?.on_hand_stock || 0
            newData.stock_customer.available_stock += stock_customer?.available_stock || 0
            newData.stock_customer.allocated_stock += stock_customer?.allocated_stock || 0
          })
        }

        data_order_items.push(newData)
      }

      for (let item of formattedOrderItems.filter(it => !it?.order_item_kfa_id)) {
        data_order_items.push({
          code_kfa_product_template: item?.material?.code,
          name_kfa_product_template: item?.material?.name,
          qty: item.qty,
          children: [item],
          stock_vendor: item?.stock_vendor,
          stock_customer: item?.stock_customer
        })
      }
    } else {

      data_order_items = formattedOrderItems.map(item => {
        return {
          code_kfa_product_template: item?.material?.code,
          name_kfa_product_template: item?.material?.name,
          qty: item.qty,
          children: [item],
          stock_vendor: item?.stock_vendor,
          stock_customer: item?.stock_customer
        }
      })
    }
    delete order.dataValues.order_items_kfa
  } else data_order_items = formattedOrderItems

  return {
    purpose,
    ...order.dataValues,
    order_items: data_order_items,
    kfa_format: order_items_kfa.length > 0 ? true : false
  }
}

export async function getOrdersData(queryParam, is_count = false) {
  let { filter } = generateFilter(queryParam)
  const limit = Number(queryParam.paginate)
  const offset = (Number(queryParam.page) - 1) * Number(queryParam.paginate)

  let attributes = ''
  if (is_count) {
    attributes = 'count(*) as total'
  } else {
    attributes = `
      \`Order\`.\`id\`, 
      \`Order\`.\`device_type\`, 
      \`Order\`.\`customer_id\`, 
      \`Order\`.\`vendor_id\`, 
      \`Order\`.\`status\`, 
      \`Order\`.\`type\`, 
      \`Order\`.\`required_date\`, 
      \`Order\`.\`estimated_date\`, 
      \`Order\`.\`purchase_ref\`, 
      \`Order\`.\`sales_ref\`, 
      \`Order\`.\`reason\`, 
      \`Order\`.\`cancel_reason\`, 
      \`Order\`.\`delivery_number\`, 
      \`Order\`.\`confirmed_at\`, 
      \`Order\`.\`shipped_at\`, 
      \`Order\`.\`fulfilled_at\`, 
      \`Order\`.\`cancelled_at\`, 
      \`Order\`.\`allocated_at\`, 
      \`Order\`.\`created_at\`, 
      \`Order\`.\`updated_at\`, 
      \`Order\`.\`is_allocated\`, 
      \`Order\`.\`taken_by_customer\`, 
      \`Order\`.\`other_reason\`, 
      \`Order\`.\`is_kpcpen\`, 
      \`Order\`.\`qty_kpcpen\`, 
      \`Order\`.\`master_order_id\`, 
      \`Order\`.\`easygo_no_do\`, 
      \`Order\`.\`biofarma_changed\`, 
      \`Order\`.\`service_type\`, 
      \`Order\`.\`no_document\`, 
      \`Order\`.\`released_date\`, 
      \`Order\`.\`notes\`, 
      \`Order\`.\`activity_id\`, 
      \`customer\`.\`id\` AS \`customer.id\`, 
      \`customer\`.\`name\` AS \`customer.name\`, 
      \`customer\`.\`address\` AS \`customer.address\`, 
      \`customer\`.\`code\` AS \`customer.code\`, 
      \`customer\`.\`type\` AS \`customer.type\`, 
      \`customer\`.\`status\` AS \`customer.status\`, 
      \`customer\`.\`created_at\` AS \`customer.created_at\`, 
      \`customer\`.\`updated_at\` AS \`customer.updated_at\`, 
      \`customer\`.\`deleted_at\` AS \`customer.deleted_at\`, 
      \`customer\`.\`province_id\` AS \`customer.province_id\`, 
      \`customer\`.\`regency_id\` AS \`customer.regency_id\`, 
      \`customer\`.\`village_id\` AS \`customer.village_id\`, 
      \`customer\`.\`sub_district_id\` AS \`customer.sub_district_id\`, 
      \`customer\`.\`lat\` AS \`customer.lat\`, 
      \`customer\`.\`lng\` AS \`customer.lng\`, 
      \`customer\`.\`postal_code\` AS \`customer.postal_code\`, 
      \`customer\`.\`is_vendor\` AS \`customer.is_vendor\`, 
      \`customer\`.\`bpom_key\` AS \`customer.bpom_key\`, 
      \`customer\`.\`is_puskesmas\` AS \`customer.is_puskesmas\`, 
      \`customer\`.\`rutin_join_date\` AS \`customer.rutin_join_date\`, 
      \`customer\`.\`is_ayosehat\` AS \`customer.is_ayosehat\`, 
      \`vendor\`.\`id\` AS \`vendor.id\`, 
      \`vendor\`.\`name\` AS \`vendor.name\`, 
      \`vendor\`.\`address\` AS \`vendor.address\`, 
      \`vendor\`.\`code\` AS \`vendor.code\`, 
      \`vendor\`.\`type\` AS \`vendor.type\`, 
      \`vendor\`.\`status\` AS \`vendor.status\`, 
      \`vendor\`.\`created_at\` AS \`vendor.created_at\`, 
      \`vendor\`.\`updated_at\` AS \`vendor.updated_at\`, 
      \`vendor\`.\`deleted_at\` AS \`vendor.deleted_at\`, 
      \`vendor\`.\`province_id\` AS \`vendor.province_id\`, 
      \`vendor\`.\`regency_id\` AS \`vendor.regency_id\`, 
      \`vendor\`.\`village_id\` AS \`vendor.village_id\`, 
      \`vendor\`.\`sub_district_id\` AS \`vendor.sub_district_id\`, 
      \`vendor\`.\`lat\` AS \`vendor.lat\`, 
      \`vendor\`.\`lng\` AS \`vendor.lng\`, 
      \`vendor\`.\`postal_code\` AS \`vendor.postal_code\`, 
      \`vendor\`.\`is_vendor\` AS \`vendor.is_vendor\`, 
      \`vendor\`.\`bpom_key\` AS \`vendor.bpom_key\`, 
      \`vendor\`.\`is_puskesmas\` AS \`vendor.is_puskesmas\`, 
      \`vendor\`.\`rutin_join_date\` AS \`vendor.rutin_join_date\`, 
      \`vendor\`.\`is_ayosehat\` AS \`vendor.is_ayosehat\`, 
      \`activity\`.\`id\` AS \`activity.id\`, 
      \`activity\`.\`name\` AS \`activity.name\`, 
      \`order_tags\`.\`id\` AS \`order_tags.id\`, 
      \`order_tags\`.\`title\` AS \`order_tags.title\`, 
      \`user_confirmed_by\`.\`id\` AS \`user_confirmed_by.id\`, 
      \`user_confirmed_by\`.\`username\` AS \`user_confirmed_by.username\`, 
      \`user_confirmed_by\`.\`email\` AS \`user_confirmed_by.email\`, 
      \`user_confirmed_by\`.\`firstname\` AS \`user_confirmed_by.firstname\`, 
      \`user_confirmed_by\`.\`lastname\` AS \`user_confirmed_by.lastname\`, 
      \`user_shipped_by\`.\`id\` AS \`user_shipped_by.id\`, 
      \`user_shipped_by\`.\`username\` AS \`user_shipped_by.username\`, 
      \`user_shipped_by\`.\`email\` AS \`user_shipped_by.email\`, 
      \`user_shipped_by\`.\`firstname\` AS \`user_shipped_by.firstname\`, 
      \`user_shipped_by\`.\`lastname\` AS \`user_shipped_by.lastname\`, 
      \`user_fulfilled_by\`.\`id\` AS \`user_fulfilled_by.id\`, 
      \`user_fulfilled_by\`.\`username\` AS \`user_fulfilled_by.username\`, 
      \`user_fulfilled_by\`.\`email\` AS \`user_fulfilled_by.email\`, 
      \`user_fulfilled_by\`.\`firstname\` AS \`user_fulfilled_by.firstname\`, 
      \`user_fulfilled_by\`.\`lastname\` AS \`user_fulfilled_by.lastname\`, 
      \`user_cancelled_by\`.\`id\` AS \`user_cancelled_by.id\`, 
      \`user_cancelled_by\`.\`username\` AS \`user_cancelled_by.username\`, 
      \`user_cancelled_by\`.\`email\` AS \`user_cancelled_by.email\`, 
      \`user_cancelled_by\`.\`firstname\` AS \`user_cancelled_by.firstname\`, 
      \`user_cancelled_by\`.\`lastname\` AS \`user_cancelled_by.lastname\`, 
      \`user_allocated_by\`.\`id\` AS \`user_allocated_by.id\`, 
      \`user_allocated_by\`.\`username\` AS \`user_allocated_by.username\`, 
      \`user_allocated_by\`.\`email\` AS \`user_allocated_by.email\`, 
      \`user_allocated_by\`.\`firstname\` AS \`user_allocated_by.firstname\`, 
      \`user_allocated_by\`.\`lastname\` AS \`user_allocated_by.lastname\`, 
      \`user_created_by\`.\`id\` AS \`user_created_by.id\`, 
      \`user_created_by\`.\`username\` AS \`user_created_by.username\`, 
      \`user_created_by\`.\`email\` AS \`user_created_by.email\`, 
      \`user_created_by\`.\`firstname\` AS \`user_created_by.firstname\`, 
      \`user_created_by\`.\`lastname\` AS \`user_created_by.lastname\`, 
      \`user_updated_by\`.\`id\` AS \`user_updated_by.id\`, 
      \`user_updated_by\`.\`username\` AS \`user_updated_by.username\`, 
      \`user_updated_by\`.\`email\` AS \`user_updated_by.email\`, 
      \`user_updated_by\`.\`firstname\` AS \`user_updated_by.firstname\`, 
      \`user_updated_by\`.\`lastname\` AS \`user_updated_by.lastname\`, 
      \`user_deleted_by\`.\`id\` AS \`user_deleted_by.id\`, 
      \`user_deleted_by\`.\`username\` AS \`user_deleted_by.username\`, 
      \`user_deleted_by\`.\`email\` AS \`user_deleted_by.email\`, 
      \`user_deleted_by\`.\`firstname\` AS \`user_deleted_by.firstname\`, 
      \`user_deleted_by\`.\`lastname\` AS \`user_deleted_by.lastname\` `
  }

  let rawQuery = `
    SELECT 
      ${attributes}
    FROM \`orders\` AS \`Order\` 
    LEFT OUTER JOIN \`smile\`.\`entities\` AS \`customer\` ON \`Order\`.\`customer_id\` = \`customer\`.\`id\` 
    AND (\`customer\`.\`deleted_at\` IS NULL) 
    LEFT OUTER JOIN \`smile\`.\`entities\` AS \`vendor\` ON \`Order\`.\`vendor_id\` = \`vendor\`.\`id\` 
    AND (\`vendor\`.\`deleted_at\` IS NULL) 
    LEFT OUTER JOIN \`master_activities\` AS \`activity\` ON \`Order\`.\`activity_id\` = \`activity\`.\`id\` 
    LEFT OUTER JOIN (
      \`order_order_tag\` AS \`order_tags->OrderOrderTag\` 
      INNER JOIN \`order_tags\` AS \`order_tags\` ON \`order_tags\`.\`id\` = \`order_tags->OrderOrderTag\`.\`order_tag_id\`
    ) ON \`Order\`.\`id\` = \`order_tags->OrderOrderTag\`.\`order_id\` 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_confirmed_by\` ON \`Order\`.\`confirmed_by\` = \`user_confirmed_by\`.\`id\` 
    AND (
      \`user_confirmed_by\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_shipped_by\` ON \`Order\`.\`shipped_by\` = \`user_shipped_by\`.\`id\` 
    AND (
      \`user_shipped_by\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_fulfilled_by\` ON \`Order\`.\`fulfilled_by\` = \`user_fulfilled_by\`.\`id\` 
    AND (
      \`user_fulfilled_by\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_cancelled_by\` ON \`Order\`.\`cancelled_by\` = \`user_cancelled_by\`.\`id\` 
    AND (
      \`user_cancelled_by\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_allocated_by\` ON \`Order\`.\`allocated_by\` = \`user_allocated_by\`.\`id\` 
    AND (
      \`user_allocated_by\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_created_by\` ON \`Order\`.\`created_by\` = \`user_created_by\`.\`id\` 
    AND (
      \`user_created_by\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_updated_by\` ON \`Order\`.\`updated_by\` = \`user_updated_by\`.\`id\` 
    AND (
      \`user_updated_by\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_deleted_by\` ON \`Order\`.\`deleted_by\` = \`user_deleted_by\`.\`id\` 
    AND (
      \`user_deleted_by\`.\`deleted_at\` IS NULL
    ) 
    WHERE 
      (
        \`Order\`.\`deleted_at\` IS NULL 
        AND (
          \`Order\`.\`id\` IS NOT NULL 
          ${filter}
        )
      ) 
    ORDER BY 
      \`Order\`.\`created_at\` DESC 
    ${is_count ? '' : `LIMIT ${offset}, ${limit}`};`

  let transactions = await sequelize.query(rawQuery, {
    nest: true,
    type: QueryTypes.SELECT,
    plain: false,
    replacements: queryParam,
  })

  return transactions
}

function generateFilter(queryParam) {
  let filter = ''
  if (queryParam.id) filter += ' AND `Order`.`id` = :id'

  if (queryParam.activity_id) {
    filter += ' AND `Order`.`activity_id` = :activity_id'
  } else {
    filter += ' AND `Order`.`activity_id` is not null'
  }

  if (queryParam.from_date && queryParam.to_date) {
    const diff = moment(queryParam.to_date).diff(moment(queryParam.from_date), 'seconds')
    if (diff >= 0) {
      if (diff === 0) queryParam.to_date = moment(queryParam.from_date).add(23, 'hour')
      filter += ' AND `Order`.`created_at` between :from_date and :to_date'
    }
  } else if (queryParam.from_date) {
    filter += ' AND `Order`.`created_at` >= :from_date'
  } else if (queryParam.to_date) {
    filter += ' AND `Order`.`created_at` <= :to_date'
  }

  if (queryParam.type) filter += ' AND `Order`.`type` in (:type)'
  if (queryParam.status) filter += ' AND `Order`.`status` in (:status)'
  if (queryParam.customer_id) filter += ' AND `Order`.`customer_id` = :customer_id'
  if (queryParam.vendor_id) filter += ' AND `Order`.`vendor_id` = :vendor_id'

  return { filter }
}

export async function getOrderItems(orderId) {
  let query = `
  SELECT 
    \`OrderItem\`.*, 
    \`material\`.\`id\` AS \`material.id\`, 
    \`material\`.\`name\` AS \`material.name\`, 
    \`material\`.\`code\` AS \`material.code\`, 
    \`material\`.\`description\` AS \`material.description\`, 
    \`material\`.\`pieces_per_unit\` AS \`material.pieces_per_unit\`, 
    \`material\`.\`unit\` AS \`material.unit\`, 
    \`material\`.\`temperature_sensitive\` AS \`material.temperature_sensitive\`, 
    \`material\`.\`temperature_min\` AS \`material.temperature_min\`, 
    \`material\`.\`temperature_max\` AS \`material.temperature_max\`, 
    \`material\`.\`managed_in_batch\` AS \`material.managed_in_batch\`, 
    \`material\`.\`status\` AS \`material.status\`, 
    \`material\`.\`is_vaccine\` AS \`material.is_vaccine\`, 
    \`material\`.\`is_stockcount\` AS \`material.is_stockcount\`, 
    \`material\`.\`bpom_code\` AS \`material.bpom_code\`, 
    \`material\`.\`is_addremove\` AS \`material.is_addremove\`, 
    \`material\`.\`updated_at\` AS \`material.updated_at\`, 
    \`material->material_tags\`.\`id\` AS \`material.material_tags.id\`, 
    \`material->material_tags\`.\`title\` AS \`material.material_tags.title\`, 
    \`material->material_tags->material_material_tag\`.\`created_at\` AS \`material.material_tags.material_material_tag.created_at\`, 
    \`material->material_tags->material_material_tag\`.\`updated_at\` AS \`material.material_tags.material_material_tag.updated_at\`, 
    \`material->material_tags->material_material_tag\`.\`material_id\` AS \`material.material_tags.material_material_tag.material_id\`, 
    \`material->material_tags->material_material_tag\`.\`material_tag_id\` AS \`material.material_tags.material_material_tag.material_tag_id\`, 
    \`material->master_material\`.\`id\` AS \`material.master_material.id\`, 
    \`material->master_material\`.\`name\` AS \`material.master_material.name\`, 
    \`material->master_material\`.\`unit\` AS \`material.master_material.unit\`, 
    \`master_material\`.\`id\` AS \`master_material.id\`, 
    \`master_material\`.\`name\` AS \`master_material.name\`, 
    \`master_material\`.\`code\` AS \`master_material.code\`, 
    \`master_material\`.\`description\` AS \`master_material.description\`, 
    \`master_material\`.\`pieces_per_unit\` AS \`master_material.pieces_per_unit\`, 
    \`master_material\`.\`unit\` AS \`master_material.unit\`, 
    \`master_material\`.\`temperature_sensitive\` AS \`master_material.temperature_sensitive\`, 
    \`master_material\`.\`temperature_min\` AS \`master_material.temperature_min\`, 
    \`master_material\`.\`temperature_max\` AS \`master_material.temperature_max\`, 
    \`master_material\`.\`managed_in_batch\` AS \`master_material.managed_in_batch\`, 
    \`master_material\`.\`status\` AS \`master_material.status\`, 
    \`master_material\`.\`is_vaccine\` AS \`master_material.is_vaccine\`, 
    \`master_material\`.\`is_stockcount\` AS \`master_material.is_stockcount\`, 
    \`master_material\`.\`is_addremove\` AS \`master_material.is_addremove\`, 
    \`master_material\`.\`updated_at\` AS \`master_material.updated_at\`, 
    \`master_material\`.\`is_openvial\` AS \`master_material.is_openvial\`, 
    \`order_stocks\`.\`id\` AS \`order_stocks.id\`, 
    \`order_stocks\`.\`order_item_id\` AS \`order_stocks.order_item_id\`, 
    \`order_stocks\`.\`stock_id\` AS \`order_stocks.stock_id\`, 
    \`order_stocks\`.\`status\` AS \`order_stocks.status\`, 
    \`order_stocks\`.\`allocated_qty\` AS \`order_stocks.allocated_qty\`, 
    \`order_stocks\`.\`received_qty\` AS \`order_stocks.received_qty\`, 
    \`order_stocks\`.\`ordered_qty\` AS \`order_stocks.ordered_qty\`, 
    \`order_stocks\`.\`fulfill_reason\` AS \`order_stocks.fulfill_reason\`, 
    \`order_stocks\`.\`other_reason\` AS \`order_stocks.other_reason\`, 
    \`order_stocks\`.\`qrcode\` AS \`order_stocks.qrcode\`, 
    \`order_stocks\`.\`fulfill_status\` AS \`order_stocks.fulfill_status\`, 
    \`order_stocks->stock\`.\`id\` AS \`order_stocks.stock.id\`, 
    \`order_stocks->stock\`.\`material_entity_id\` AS \`order_stocks.stock.material_entity_id\`, 
    \`order_stocks->stock\`.\`batch_id\` AS \`order_stocks.stock.batch_id\`, 
    \`order_stocks->stock\`.\`status\` AS \`order_stocks.stock.status\`, 
    \`order_stocks->stock\`.\`qty\` AS \`order_stocks.stock.qty\`, 
    \`order_stocks->stock\`.\`created_by\` AS \`order_stocks.stock.created_by\`, 
    \`order_stocks->stock\`.\`updated_by\` AS \`order_stocks.stock.updated_by\`, 
    \`order_stocks->stock\`.\`updatedAt\` AS \`order_stocks.stock.updatedAt\`, 
    \`order_stocks->stock\`.\`createdAt\` AS \`order_stocks.stock.createdAt\`, 
    \`order_stocks->stock\`.\`allocated\` AS \`order_stocks.stock.allocated\`, 
    \`order_stocks->stock\`.\`open_vial\` AS \`order_stocks.stock.open_vial\`, 
    \`order_stocks->stock\`.\`activity_id\` AS \`order_stocks.stock.activity_id\`, 
    \`order_stocks->stock->batch\`.\`id\` AS \`order_stocks.stock.batch.id\`, 
    \`order_stocks->stock->batch\`.\`code\` AS \`order_stocks.stock.batch.code\`, 
    \`order_stocks->stock->batch\`.\`expired_date\` AS \`order_stocks.stock.batch.expired_date\`, 
    \`order_stocks->stock->batch\`.\`production_date\` AS \`order_stocks.stock.batch.production_date\`, 
    \`order_stocks->stock->batch\`.\`manufacture_id\` AS \`order_stocks.stock.batch.manufacture_id\`, 
    \`order_stocks->stock->batch->manufacture\`.\`id\` AS \`order_stocks.stock.batch.manufacture.id\`, 
    \`order_stocks->stock->batch->manufacture\`.\`name\` AS \`order_stocks.stock.batch.manufacture.name\`, 
    \`order_stocks->order_stock_exterminations\`.\`id\` AS \`order_stocks.order_stock_exterminations.id\`, 
    \`order_stocks->order_stock_exterminations\`.\`order_stock_id\` AS \`order_stocks.order_stock_exterminations.order_stock_id\`, 
    \`order_stocks->order_stock_exterminations\`.\`stock_extermination_id\` AS \`order_stocks.order_stock_exterminations.stock_extermination_id\`, 
    \`order_stocks->order_stock_exterminations\`.\`status\` AS \`order_stocks.order_stock_exterminations.status\`, 
    \`order_stocks->order_stock_exterminations\`.\`allocated_discard_qty\` AS \`order_stocks.order_stock_exterminations.allocated_discard_qty\`, 
    \`order_stocks->order_stock_exterminations\`.\`allocated_received_qty\` AS \`order_stocks.order_stock_exterminations.allocated_received_qty\`, 
    \`order_stocks->order_stock_exterminations\`.\`received_qty\` AS \`order_stocks.order_stock_exterminations.received_qty\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination\`.\`id\` AS \`order_stocks.order_stock_exterminations.stock_extermination.id\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination\`.\`stock_id\` AS \`order_stocks.order_stock_exterminations.stock_extermination.stock_id\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination\`.\`transaction_reason_id\` AS \`order_stocks.order_stock_exterminations.stock_extermination.transaction_reason_id\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination\`.\`extermination_discard_qty\` AS \`order_stocks.order_stock_exterminations.stock_extermination.extermination_discard_qty\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination\`.\`extermination_received_qty\` AS \`order_stocks.order_stock_exterminations.stock_extermination.extermination_received_qty\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination\`.\`extermination_qty\` AS \`order_stocks.order_stock_exterminations.stock_extermination.extermination_qty\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination\`.\`extermination_shipped_qty\` AS \`order_stocks.order_stock_exterminations.stock_extermination.extermination_shipped_qty\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination->transaction_reason\`.\`id\` AS \`order_stocks.order_stock_exterminations.stock_extermination.transaction_reason.id\`, 
    \`order_stocks->order_stock_exterminations->stock_extermination->transaction_reason\`.\`title\` AS \`order_stocks.order_stock_exterminations.stock_extermination.transaction_reason.title\`, 
    \`user_created_by\`.\`id\` AS \`user_created_by.id\`, 
    \`user_created_by\`.\`username\` AS \`user_created_by.username\`, 
    \`user_created_by\`.\`email\` AS \`user_created_by.email\`, 
    \`user_created_by\`.\`firstname\` AS \`user_created_by.firstname\`, 
    \`user_created_by\`.\`lastname\` AS \`user_created_by.lastname\`, 
    \`user_updated_by\`.\`id\` AS \`user_updated_by.id\`, 
    \`user_updated_by\`.\`username\` AS \`user_updated_by.username\`, 
    \`user_updated_by\`.\`email\` AS \`user_updated_by.email\`, 
    \`user_updated_by\`.\`firstname\` AS \`user_updated_by.firstname\`, 
    \`user_updated_by\`.\`lastname\` AS \`user_updated_by.lastname\`, 
    \`user_deleted_by\`.\`id\` AS \`user_deleted_by.id\`, 
    \`user_deleted_by\`.\`username\` AS \`user_deleted_by.username\`, 
    \`user_deleted_by\`.\`email\` AS \`user_deleted_by.email\`, 
    \`user_deleted_by\`.\`firstname\` AS \`user_deleted_by.firstname\`, 
    \`user_deleted_by\`.\`lastname\` AS \`user_deleted_by.lastname\` 
  FROM 
  (
    SELECT 
      \`OrderItem\`.\`id\`, 
      \`OrderItem\`.\`qty\`, 
      \`OrderItem\`.\`master_material_id\`, 
      \`OrderItem\`.\`recommended_stock\`, 
      \`OrderItem\`.\`order_id\`, 
      \`OrderItem\`.\`material_id\`, 
      \`OrderItem\`.\`created_by\`, 
      \`OrderItem\`.\`updated_by\`, 
      \`OrderItem\`.\`deleted_by\` 
    FROM 
      \`order_items\` AS \`OrderItem\` 
    WHERE 
      (
        \`OrderItem\`.\`deleted_at\` IS NULL 
        AND (
          \`OrderItem\`.\`order_id\` IN (:orderId) 
          AND (
            \`OrderItem\`.\`deleted_at\` IS NULL 
            AND \`OrderItem\`.\`master_material_id\` IS NOT NULL
          )
        )
      )
  ) AS \`OrderItem\` 
  LEFT OUTER JOIN \`materials\` AS \`material\` ON \`OrderItem\`.\`material_id\` = \`material\`.\`id\` 
  AND (\`material\`.\`deleted_at\` IS NULL) 
  LEFT OUTER JOIN (
    \`material_material_tag\` AS \`material->material_tags->material_material_tag\` 
    INNER JOIN \`material_tags\` AS \`material->material_tags\` ON \`material->material_tags\`.\`id\` = \`material->material_tags->material_material_tag\`.\`material_tag_id\`
  ) ON \`material\`.\`id\` = \`material->material_tags->material_material_tag\`.\`material_id\` 
  AND (
    \`material->material_tags\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`master_materials\` AS \`material->master_material\` ON \`material\`.\`master_material_id\` = \`material->master_material\`.\`id\` 
  AND (
    \`material->master_material\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`master_materials\` AS \`master_material\` ON \`OrderItem\`.\`master_material_id\` = \`master_material\`.\`id\` 
  AND (
    \`master_material\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`order_stocks\` AS \`order_stocks\` ON \`OrderItem\`.\`id\` = \`order_stocks\`.\`order_item_id\` 
  AND (
    \`order_stocks\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`stocks\` AS \`order_stocks->stock\` ON \`order_stocks\`.\`stock_id\` = \`order_stocks->stock\`.\`id\` 
  LEFT OUTER JOIN \`batches\` AS \`order_stocks->stock->batch\` ON \`order_stocks->stock\`.\`batch_id\` = \`order_stocks->stock->batch\`.\`id\` 
  AND (
    \`order_stocks->stock->batch\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`manufactures\` AS \`order_stocks->stock->batch->manufacture\` ON \`order_stocks->stock->batch\`.\`manufacture_id\` = \`order_stocks->stock->batch->manufacture\`.\`id\` 
  AND (
    \`order_stocks->stock->batch->manufacture\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`order_stock_exterminations\` AS \`order_stocks->order_stock_exterminations\` ON \`order_stocks\`.\`id\` = \`order_stocks->order_stock_exterminations\`.\`order_stock_id\` 
  AND (
    \`order_stocks->order_stock_exterminations\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`stock_exterminations\` AS \`order_stocks->order_stock_exterminations->stock_extermination\` ON \`order_stocks->order_stock_exterminations\`.\`stock_extermination_id\` = \`order_stocks->order_stock_exterminations->stock_extermination\`.\`id\` 
  LEFT OUTER JOIN \`transaction_reasons\` AS \`order_stocks->order_stock_exterminations->stock_extermination->transaction_reason\` ON \`order_stocks->order_stock_exterminations->stock_extermination\`.\`transaction_reason_id\` = \`order_stocks->order_stock_exterminations->stock_extermination->transaction_reason\`.\`id\` 
  AND (
    \`order_stocks->order_stock_exterminations->stock_extermination->transaction_reason\`.\`deletedAt\` IS NULL
  ) 
  LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_created_by\` ON \`OrderItem\`.\`created_by\` = \`user_created_by\`.\`id\` 
  AND (
    \`user_created_by\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_updated_by\` ON \`OrderItem\`.\`updated_by\` = \`user_updated_by\`.\`id\` 
  AND (
    \`user_updated_by\`.\`deleted_at\` IS NULL
  ) 
  LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_deleted_by\` ON \`OrderItem\`.\`deleted_by\` = \`user_deleted_by\`.\`id\` 
  AND (
    \`user_deleted_by\`.\`deleted_at\` IS NULL
  );`

  let orderItems = await sequelize.query(query, {
    nest: true,
    type: QueryTypes.SELECT,
    plain: false,
    replacements: { orderId },
  })

  return orderItems
}

export async function getOrderStocks(orderItemId) {
  let query = `
  SELECT * 
  FROM order_stocks
  WHERE order_item_id in (:orderItemId)
  ;`

  let orderItems = await sequelize.query(query, {
    nest: true,
    type: QueryTypes.SELECT,
    plain: false,
    replacements: { orderItemId },
  })

  return orderItems
}

export async function getOrderComments(orderId) {
  let query = `
  SELECT * 
  FROM order_comments
  WHERE order_id in (:orderId)
  ;`

  let orderComments = await sequelize.query(query, {
    nest: true,
    type: QueryTypes.SELECT,
    plain: false,
    replacements: { orderId },
  })

  return orderComments
}

export async function orderDetailFromDB(id, req) {
  const items = await models.OrderItem.getItemsOfOrder(id)

  const includeOrder = [{
    association: 'track_device',
    attributes: ['id', 'nopol', 'mobile_phone'],
    required: false,
  }, {
    association: 'activity',
    attributes: ['id', 'name'],
    required: false,
    paranoid: false
  }]

  if (process.env.APP_SERVICE === 'logistic')
    includeOrder.push({
      association: 'order_items_kfa',
      include: {
        association: 'mapping_master_material'
      },
      with_stocks: true
    })

  let order = await models.Order.findOne({
    where: [{
      id,
      activity_id: { [Op.not]: null },
    }],
    include: includeOrder,
    without_items: true,
    order_items_projection: true
  })

  if (!order) return null

  order.order_items = items
  order = await mappingDetail({ order, req })

  order.order_tracking = null
  order.canvas_tracking = getCanvasUrl()

  if (order.track_device) {
    // get last position info
    const listNopol = [order.track_device.nopol]
    let easyGoData = {
      nopol: null,
      status: '',
      temperature: 0,
      timestamp: '',
    }
    let canvas_url = ''
    let easyGoDataArr = await getLastPosition(listNopol, id)
    if (easyGoDataArr[0]) easyGoData = easyGoDataArr[0]

    if (order.status === ORDER_STATUS.FULFILLED) {
      canvas_url = await getCanvasTrackingUrl({
        nopol: order.track_device.nopol,
        startDate: order.shipped_at,
        startEnd: order.fulfilled_at,
      })
    } else {
      canvas_url = getCanvasUrl(order.track_device.nopol)
    }
    order.order_tracking = {
      ...easyGoData,
      canvas_url,
    }
  }

  return order
}

const fixedFloatComma = (value) => {
  return {
    ...value,
    capacity_asset: Number(value.capacity_asset.toFixed(2)),
    total_volume: Number(value.total_volume.toFixed(2)),
    percent_capacity: Number(value.percent_capacity.toFixed(2)),
  }
}

const getOrderItemProjectionCapacity = async (orderId, transaction) => {
  const dataOrderItemProjectionCapacity = await models.OrderItemProjectionCapacity.findOne({
    raw: true,
    where: { order_id: orderId, is_confirm: false },
    attributes: ['capacity_asset', 'total_volume', 'percent_capacity'],
    transaction
  })
  return dataOrderItemProjectionCapacity
}

const setOrderItemProjectionCapacity = async (order, body, transaction) => {
  const orderItems = await models.OrderItem.findAll({
    raw: true,
    where: { order_id: order.id },
    attributes: ['master_material_id', 'qty'],
    without_relations: true,
    transaction
  })

  const materialQtyJSON = {}
  const masterMaterialId = []
  for (let i = 0; i < orderItems.length; i++) {
    const { master_material_id = null, qty = 0 } = orderItems[i]
    materialQtyJSON[Number(master_material_id)] = Number(qty)
    masterMaterialId.push(master_material_id)
  }
  await saveOrderItemProjectionCapacity({
    body, order, orderItems, masterMaterialId, materialQtyJSON, transaction, isCreate: true
  })
}

export async function saveOrderItemProjectionCapacity({ body, order, orderItems, masterMaterialId, materialQtyJSON, transaction, isCreate, isUpdate, isConfirm = false }) {
  // save projection capacity
  const mvmmJSON = {}
  const [coldstorageData, mvmmData] = await Promise.all([
    models.Coldstorage.findOne({
      raw: true,
      attributes: [
        'entity_id',
        'volume_asset',
        'total_volume',
        'percentage_capacity',
      ],
      where: {
        entity_id: body.customer_id || order.customer_id,
      },
    }),
    models.MasterVolumeMaterialManufacture.findAll({
      raw: true,
      attributes: [
        'master_material_id',
        'pieces_per_unit',
        'unit_per_box',
        'box_length',
        'box_width',
        'box_height',
        [sequelize.fn('MAX', sequelize.col('created_at')), 'lastCreatedAt'] // Assuming 'createdAt' is the timestamp of your records
      ],
      where: {
        master_material_id: masterMaterialId
      },
      group: ['master_material_id']
    })
  ])

  mvmmData.map(item => {
    mvmmJSON[Number(item.master_material_id)] = item
    return item
  })
  const projectionCapacityData = {
    capacity_asset: coldstorageData?.volume_asset || 0,
    total_volume: 0,
    percent_capacity: 0,
    order_id: order.id,
    is_confirm: isConfirm,
    created_by: body.created_by,
    updated_by: body.updated_by,
  }
  for (const item of orderItems) {
    const materialID = item.master_material_id || item.material_id
    const materialQty = materialQtyJSON[materialID]
    const mvmmItem = mvmmJSON[materialID]
    const volumeMaterialQty = mvmmItem ? (materialQty / mvmmItem.pieces_per_unit / mvmmItem.unit_per_box) * (mvmmItem.box_length * mvmmItem.box_width * mvmmItem.box_height) / 1000 : 0
    projectionCapacityData.total_volume += volumeMaterialQty
  }

  if (isCreate) { // create order
    projectionCapacityData.total_volume += coldstorageData?.total_volume || 0
    projectionCapacityData.percent_capacity = projectionCapacityData.capacity_asset > 0 ? (projectionCapacityData.total_volume / projectionCapacityData.capacity_asset) * 100 : 0
    await models.OrderItemProjectionCapacity.create(fixedFloatComma(projectionCapacityData), { transaction })
  } else if (isUpdate) {  // update order
    projectionCapacityData.total_volume += coldstorageData?.total_volume || 0
    projectionCapacityData.percent_capacity = projectionCapacityData.capacity_asset > 0 ? (projectionCapacityData.total_volume / projectionCapacityData.capacity_asset) * 100 : 0
    delete projectionCapacityData.created_by
    await models.OrderItemProjectionCapacity.update(fixedFloatComma(projectionCapacityData), { where: { order_id: order.id }, transaction })
  } else {  // tambah order item
    //jika update tambahkan ke data sebelumnya
    let dataOrderItemProjectionCapacity = await getOrderItemProjectionCapacity(order.id, transaction)
    // jika tidak ada order item projection capacity maka tambahkan. case order lama 
    if (!dataOrderItemProjectionCapacity) return await setOrderItemProjectionCapacity(order, body, transaction) 
    projectionCapacityData.total_volume += dataOrderItemProjectionCapacity.total_volume
    projectionCapacityData.percent_capacity = projectionCapacityData.capacity_asset > 0 ? (projectionCapacityData.total_volume / projectionCapacityData.capacity_asset) * 100 : 0
    delete projectionCapacityData.created_by
    delete projectionCapacityData.order_id
    await models.OrderItemProjectionCapacity.update(fixedFloatComma(projectionCapacityData), { where: { order_id: order.id }, transaction })
  }
}

export async function create(req, res, next) {
  const deviceID = req.headers['device-type']
  const device_type = DEVICE_TYPE[deviceID]

  const user = req.user
  if (user) {
    req.body = {
      ...req.body,
      created_by: user.id,
      updated_by: user.id,
    }
  }

  req.body = {
    ...req.body,
    status: ORDER_STATUS.PENDING, // first time create status pending
    device_type,
  }

  let { order_items: orderItems, order_comment: orderComment } = req.body
  const t = await models.sequelize.transaction()
  try {
    let order = await models.Order.create(req.body, { transaction: t })

    if (orderComment) {
      await models.OrderComment.create({
        ...orderComment,
        order_id: order.id,
        user_id: user?.id || null,
        order_status: ORDER_STATUS.PENDING,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
      }, { transaction: t })
    }

    if (process.env.APP_SERVICE === 'logistic') {
      orderItems = orderItems.map(item => {
        if (item.children)
          item.children = item.children.map(it => {
            let newIt = {
              ...it,
              order_id: order.id,
              master_material_id: it.material_id,
              qty: it.ordered_qty,
            }
            delete newIt.material_id
            return newIt
          })
        let newData = {
          ...item,
          qty: item.ordered_qty,
          order_id: order.id,
          order_items: item.children ?? []
        }
        delete newData.children
        delete newData.material_id
        return newData
      })

      await models.OrderItemKfa.bulkCreate(orderItems, {
        include: { association: 'order_items' },
        transaction: t
      })
    } else {
      const materialQtyJSON = {}
      const masterMaterialId = []
      orderItems = orderItems.map(item => {
        let newData = {
          ...item,
          master_material_id: item.material_id,
          qty: item.ordered_qty,
          order_id: order.id,
          created_by: req.body.created_by,
          updated_by: req.body.updated_by,
        }
        materialQtyJSON[Number(item.material_id)] = Number(item.ordered_qty)
        masterMaterialId.push(item.material_id)
        delete newData.material_id
        return newData
      })
      await Promise.all([
        models.OrderItem.bulkCreate(orderItems, { transaction: t }),
        // save projection capacity
        saveOrderItemProjectionCapacity({
          body: req.body, order, orderItems, masterMaterialId, materialQtyJSON, transaction: t, isCreate: true
        })
      ])
    }

    await t.commit()
    if (process.env.APP_SERVICE === 'logistic') order = await orderDetailFromDB(order.id, req)
    else order = await models.Order.findByPk(order.id, { order_items_projection: true })

    return res.status(201).json(order)
  } catch (err) {
    await t.rollback()
    console.error(err)
    return next(err)
  }
}

export async function update(req, res, next) {
  const orderId = req.params.id
  const user = req.user
  const updatedField = [
    'required_date',
    'purchase_ref',
    'order_reason',
    'order_items',
    'order_comment'
  ]

  let order = await models.Order.findByPk(orderId)
  if (!order) return res.status(404).json({ message: req.__('404') })

  // filter req.body
  let updateBody = {}
  for (var key in req.body) {
    if (updatedField.includes(key)) updateBody[key] = req.body[key]
  }

  if (user) {
    updateBody = {
      ...updateBody,
      updated_by: user.id,
    }

    req.body = {
      ...req.body,
      updated_by: user.id,
    }
  }

  if (user.entity_id === order.vendor_id) return res.status(403).json({ message: req.__('403') })

  const { order_items: orderItems, order_comment: orderComment } = updateBody

  const t = await models.sequelize.transaction()
  try {
    await models.Order.update(updateBody, { where: { id: order.id } }, { transaction: t })

    if (orderComment) {
      await createComment({
        ...orderComment,
        order_id: order.id,
        order_status: order.status,
        user_id: user.id,
        created_by: user.id,
        updated_by: user.id,
      }, t)
    }

    const materialQtyJSON = {}
    const masterMaterialId = []

    for (let k = 0; k < orderItems.length; k++) {
      const {
        id, ordered_qty, reason_id, other_reason, material_id
      } = orderItems[k]

      if (process.env.APP_SERVICE === 'logistic') {
        const { children = [] } = orderItems[k]
        const sourceOrderItemKfa = await models.OrderItemKfa.findByPk(id)
        if (sourceOrderItemKfa) {
          await sourceOrderItemKfa.update({
            qty: ordered_qty, reason_id, other_reason,
          }, { transaction: t })
        }

        for (let l = 0; l < children.length; l++) {
          const { id: IdItem, ordered_qty: orderedQty } = children[l]
          const sourceOrderItem = await models.OrderItem.findByPk(IdItem)
          if (sourceOrderItem) {
            const orderStock = await models.OrderStock.findOne({
              where: { order_item_id: sourceOrderItem.id },
            })
            if (orderStock) {
              await orderStock.update({ orderedQty }, { transaction: t })
            }

            await sourceOrderItem.update({
              qty: orderedQty, updated_by: user.id
            }, { transaction: t })
          }
        }

      } else {
        const sourceOrderItem = await models.OrderItem.findByPk(id)
        if (sourceOrderItem) {
          const orderStock = await models.OrderStock.findOne({
            where: { order_item_id: sourceOrderItem.id },
          })
          materialQtyJSON[Number(material_id)] = Number(ordered_qty)
          masterMaterialId.push(material_id)

          if (orderStock) {
            await orderStock.update({ ordered_qty }, { transaction: t })
          }

          await sourceOrderItem.update({
            qty: ordered_qty, updated_by: user.id, reason_id, other_reason,
          }, { transaction: t })
        }
      }

    }

    await saveOrderItemProjectionCapacity({
      body: req.body, order, orderItems, masterMaterialId, materialQtyJSON, transaction: t, isUpdate: true
    })

    await t.commit()

    if (process.env.APP_SERVICE === 'logistic') order = await orderDetailFromDB(order.id, req)
    else order = await models.Order.findByPk(order.id, { order_items_projection: true })

    return res.status(200).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    const { id } = req.params

    let order = await orderDetailFromDB(id, req)

    if (!order) throw { status: 404, message: req.__('404') }
    // return data
    return res.status(200).json(order)
  } catch (err) {
    console.log('Error get detail', err)
    return next(err)
  }
}

export async function insertOrderItem(req, res, next) {
  const { id } = req.params
  const { order_items: orderItems } = req.body
  const { user } = req

  req.body.updated_by = user.id
  req.body.created_by = user.id

  let order = await models.Order.findByPk(id)
  if (user.entity_id === order.vendor_id) return res.status(403).json({ message: req.__('403') })

  const t = await models.sequelize.transaction()
  try {
    const materialQtyJSON = {}
    const masterMaterialId = []
    for (let i = 0; i < orderItems.length; i++) {
      const {
        material_id = null, ordered_qty = 0, reason_id, 
        other_reason, order_item_kfa_id = null
      } = orderItems[i]
      await models.OrderItem.create({
        master_material_id: material_id,
        qty: ordered_qty,
        order_id: order.id,
        created_by: user.id,
        updated_by: user.id,
        reason_id,
        other_reason,
        order_item_kfa_id
      }, { transaction: t })
      materialQtyJSON[Number(material_id)] = Number(ordered_qty)
      masterMaterialId.push(material_id)
      // const materialEntity = await models.EntityMasterMaterial.findOne({
      //   where: { master_material_id: material_id, entity_id: order.vendor_id },
      // })
      // let stock = await models.Stock.findOne({
      //   where: {
      //     batch_id,
      //     entity_has_material_id: materialEntity.id,
      //     activity_id: order.activity_id,
      //   },
      // })
      // if (!stock) { 
      // if no stock will be created
      // stock = await models.Stock.create({
      //   batch_id,
      //   entity_has_material_id: materialEntity.id,
      //   activity_id: order.activity_id,
      //   qty: 0,
      //   created_by: user.id,
      //   updated_by: user.id,
      // }, { transaction: t })
      // }

      // await models.OrderStock.create({
      //   ordered_qty,
      //   order_item_id: orderItem.id,
      //   stock_id: stock.id,
      //   created_by: user.id,
      //   updated_by: user.id,
      // }, { transaction: t })
    }
    await saveOrderItemProjectionCapacity({
      body: req.body, order, orderItems, masterMaterialId, materialQtyJSON, transaction: t
    })

    order = await models.Order.findByPk(id, { order_items_projection: true, transaction: t })
    await t.commit()

    return res.status(200).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function insertOrderItemKfa(req, res, next) {
  const { id } = req.params
  let { order_items: orderItems } = req.body
  const { user } = req

  let order = await models.Order.findByPk(id)
  if (user.entity_id === order.vendor_id) return res.status(403).json({ message: req.__('403') })

  const t = await models.sequelize.transaction()
  try {

    orderItems = orderItems.map(item => {
      let {
        code_kfa_product_template, ordered_qty = 0, recommended_stock, reason_id, other_reason, children = []
      } = item

      children = children.map(itm => {
        const { material_id = null, ordered_qty = 0 } = itm
        delete itm.material_id
        delete itm.ordered_qty
        return {
          ...itm,
          master_material_id: material_id,
          qty: ordered_qty,
          order_id: order.id,
          created_by: user.id,
          updated_by: user.id,
        }
      })

      return {
        code_kfa_product_template,
        qty: ordered_qty,
        order_id: order.id,
        reason_id,
        other_reason,
        recommended_stock,
        order_items: children
      }
    })

    await models.OrderItemKfa.bulkCreate(orderItems, {
      include: { association: 'order_items' },
      transaction: t
    })

    await t.commit()

    order = await orderDetailFromDB(id, req)
    return res.status(200).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}