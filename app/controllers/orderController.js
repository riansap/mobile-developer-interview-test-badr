import { Op } from 'sequelize'
import moment from 'moment'
import _ from 'lodash'
import stream from 'stream'

import {
  DEVICE_TYPE, ORDER_STATUS, ORDER_TYPE, TRANSACTION_TYPE, USER_ROLE, getOrderStatusLabel,
} from '../helpers/constants'
import { generateOrderNotification } from '../helpers/notifications/orderNotification'
import { getCanvasTrackingUrl, getCanvasUrl, getLastPosition } from '../helpers/integrations/easyGoHelper'
import { suratBuktiBarangKeluar, varReport, suratBuktiBarangKeluarTwo, varReportTwo, reportPenerimaan, requirementLetter, notaBatch, notaConfirmation, varReportLogistic } from '../helpers/xls/excelTemplate'

import models from '../models'
import { orderDetailFromDB as orderDetailV2 } from './v2/order/orderNormalController'

const mappingData = ({ data: order, req }) => {
  let purpose = null

  if (req.user) {
    const { vendor_id, customer_id } = order
    if (customer_id === req.user.entity_id) purpose = 'purchase'
    else if (vendor_id === req.user.entity_id) purpose = 'sales'
  }

  let { order_items = [] } = order
  if (Array.isArray(order_items)) {
    order_items = order_items.map((order_item) => {
      let { order_stocks = [] } = order_item
      if (Array.isArray(order_stocks)) {
        order_stocks = order_stocks.map((order_stock) => {
          const { stock = {}, order_stock_purchase } = order_stock
          const { batch = {} } = stock

          return {
            id: order_stock?.id || null,
            status: order_stock?.status || null,
            order_item_id: order_stock?.order_item_id || null,
            stock_id: order_stock?.stock_id || null,
            allocated_qty: order_stock?.allocated_qty || null,
            received_qty: order_stock?.received_qty || null,
            ordered_qty: order_stock?.ordered_qty || null,
            qty: stock.qty || null,
            batch: (batch === null || batch === undefined) ? null : {
              id: batch?.id || null,
              code: batch?.code || null,
              expired_date: batch?.expired_date || null,
              production_date: batch?.production_date || null,
              manufacture_name: batch?.manufacture_name || null,

              year: order_stock_purchase?.year || null,
              price: order_stock_purchase?.price || null,
              total_price: order_stock_purchase?.total_price || null,
              source_material_id: order_stock_purchase?.source_material_id || null,
              source_material_name: order_stock_purchase?.source_material?.name || '',
              pieces_purchase_id: order_stock_purchase?.pieces_purchase_id || null,
              pieces_purchase_name: order_stock_purchase?.pieces_purchase?.name || ''
            },
            stock,
            order_stock_purchase
          }
        })
      }
      return {
        ...order_item.dataValues,
        order_stocks,
      }
    })
  }
  return {
    purpose,
    ...order.dataValues,
    order_items,
  }
}

export async function list(req, res, next) {
  try {
    const {
      purpose,
      vendorId,
      customerId,
      ordered_number,
      purchase_ref,
      sales_ref,
      entity_tag_id,
    } = req.query || {}

    let {
      status,
      entityId,
      to_date,
      from_date,
      type
    } = req.query

    let { tags } = req.query || {}
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags)
      } catch (err) {
        tags = []
      }
    }

    const { role } = req.user || {}

    let entityTag = {}
    if (entity_tag_id) {
      entityTag = {
        include: {
          association: 'entity_tags',
          attributes: ['id']
        },
      }
    }

    const include = [
      {
        model: models.Entity,
        as: 'customer',
        attributes: models.Entity.getBasicAttribute(),
        ...entityTag,
      },
      {
        model: models.Entity,
        as: 'vendor',
        attributes: models.Entity.getBasicAttribute(),
        ...entityTag,
      },
      {
        model: models.OrderTag,
        as: 'order_tags',
        attributes: ['id', 'title'],
        through: { attributes: [] },
      },
      {
        model: models.OrderItem,
        as: 'order_items',
        attributes: ['id', 'qty', 'material_id', 'recommended_stock'],
        separate: true,
      },
    ]

    const condition = {}
    if (ordered_number) condition.id = Number(ordered_number)
    if (purchase_ref) condition.purchase_ref = purchase_ref
    if (sales_ref) condition.sales_ref = sales_ref
    if (type) {
      type = type.split(',')
      condition.type = { [Op.in]: type }
    }
    if (status) {
      status = status.split(',')
      condition.status = { [Op.in]: status }
    }

    if (from_date && to_date) {
      const diff = moment(to_date).diff(moment(from_date), 'seconds')
      if (diff >= 0) {
        if (diff === 0) {
          to_date = moment(from_date).add(23, 'hour')
        }
        condition.created_at = {
          [Op.between]: [moment(from_date).toDate(), moment(to_date).toDate()],
        }
      }
    } else if (from_date) {
      condition.created_at = {
        [Op.gte]: moment(from_date).toDate(),
      }
    } else if (to_date) {
      condition.created_at = {
        [Op.lte]: moment(to_date).toDate(),
      }
    }

    if (Array.isArray(tags) && tags.length > 0) {
      condition['$order_tags.id$'] = { [Op.in]: tags }
    }

    if (purpose === 'purchase' || purpose === 'sales') {
      if (purpose === 'purchase') {
        if (entity_tag_id) {
          include[0].include.where = { id: Number(entity_tag_id) }
        } else {
          condition.customer_id = req.user.entity_id
        }
        if (customerId) condition.customer_id = customerId
        if (vendorId) condition.vendor_id = { [Op.in]: vendorId.split(',') }
        else if (entityId) condition.vendor_id = entityId
      } else if (purpose === 'sales') {
        if (customerId) entityId = customerId
        if (entity_tag_id) {
          include[1].include.where = { id: Number(entity_tag_id) }
        } else {
          condition.vendor_id = req.user.entity_id
        }

        if (vendorId) condition.vendor_id = vendorId
        if (entityId) condition.customer_id = entityId
      }
    } else if (role === USER_ROLE.OPERATOR || role === USER_ROLE.OPERATOR_COVID) {
      if (vendorId) entityId = vendorId

      condition.customer_id = req.user.entity_id
      if (entityId) condition.vendor_id = entityId
    } else if (role === USER_ROLE.MANAGER) {
      if (customerId) entityId = customerId
      condition.vendor_id = req.user.entity_id
      if (entityId) condition.customer_id = entityId
    }

    req.condition = condition
    req.include = include
    req.customOptions = {
      excludeCustomerVendor: true, subQuery: false, without_items: true, without_comments: true,
    }
    req.order = [['created_at', 'desc']]

    req.mappingDocs = ({ docs }) => docs.map((order) => {
      let { order_items = [] } = order
      if (Array.isArray(order_items)) {
        order_items = order_items.map((order_item) => mappingData({ data: order_item, req }))
      }
      return {
        ...order.dataValues,
        order_items,
      }
    })

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function orderItem(req, res, next) {
  try {
    const { id: order_id } = req.params
    if (order_id) {
      req.condition = {
        order_id,
      }
      req.customOptions = {
        with_stocks: true,
      }
    }

    req.include = {
      association: 'order',
      attributes: ['id', 'status'],
    }
    next()
  } catch (err) {
    return next(err)
  }
}

export async function exportOrderExcel(req, res, next) {
  try {
    let orderCondition = {}
    if (req.condition) {
      orderCondition = req.condition
      req.condition = {}
    }

    req.include = [{
      association: 'order',
      where: orderCondition,
      include: [{
        association: 'user_created_by',
        attributes: ['firstname', 'lastname'],
      }, {
        association: 'user_updated_by',
        attributes: ['firstname', 'lastname'],
      }, {
        association: 'customer',
        attributes: ['name'],
      }, {
        association: 'vendor',
        attributes: ['name'],
      }, {
        association: 'order_comments',
        attributes: ['comment', 'order_status'],
      }],
    }]

    req.xlsColumns = [
      { key: 'order_id', title: 'Order ID' },
      { key: 'status_label', title: 'Status' },
      { key: 'customer_name', title: 'Customer Name' },
      { key: 'vendor_name', title: 'Vendor Name' },
      { key: 'material_name', title: 'Material Name' },
      { key: 'order_item_reason', title: 'Order Item Reason' },
      { key: 'ordered_qty', title: 'Quantity Ordered' },
      { key: 'received_qty', title: 'Quantity Fulfilled' },
      { key: 'material_tags_name', title: 'Material Tags' },
      { key: 'created_by', title: 'Created by full name' },
      { key: 'created_at', title: 'Created On' },
      { key: 'updated_at', title: 'Updated On' },
      { key: 'updated_by', title: 'Status updated by full name' },
      { key: 'status_updated_at', title: 'Status updated on' },
      { key: 'batch_name', title: 'Batch' },
      { key: 'batch_expired_date', title: 'Expired Date Batch' },
      { key: 'quantity_per_batch', title: 'Quantity per Batch' },
      { key: 'delivery_number', title: 'No DO' },
      { key: 'service_type', title: 'Service Type' },
      { key: 'no_document', title: 'No Document' },
      { key: 'released_date', title: 'Release Date' },
      { key: 'notes', title: 'Notes' },
      { key: 'confirmed_qty', title: 'Quantity Confirmed' },
      { key: 'comment_shipped', title: 'Comment "Dikirim"' },
      { key: 'comment_fullfil', title: 'Comment "Diterima"' },
      { key: 'confirmed_at', title: 'Confirmed At' },
      { key: 'allocated_at', title: 'Allocated At' },
      { key: 'shipped_at', title: 'Shipped At' },
    ]

    const currentDate = new Date()
    req.xlsFilename = `orders ${currentDate}`

    req.mappingContents = ({ data, index }) => {
      let item = {}
      const { order, order_stocks, material } = data

      let received_qty = 0
      let comment_shipped = []
      let comment_fullfil = []
      const materialTags = []

      order_stocks.forEach((stock) => {
        received_qty += stock.received_qty
      })

      order.order_comments.forEach((el) => {
        if (el.order_status === ORDER_STATUS.SHIPPED) {
          comment_shipped.push(el.comment)
        }
        else if (el.order_status === ORDER_STATUS.FULFILLED) {
          comment_fullfil.push(el.comment)
        }
      })

      material.material_tags.forEach((tag) => {
        materialTags.push(tag.title)
      })

      let service_type = ''
      switch (Number(order.service_type)) {
        case 1:
          service_type = 'Reguler'
          break
        case 2:
          service_type = 'Buffer Provinsi'
          break
        case 3:
          service_type = 'Buffer Pusat'
          break
        default:
          service_type = ''
          break
      }

      const statusLabel = getOrderStatusLabel(order.status)

      item = {
        ...data.dataValues,
        status_label: statusLabel,
        customer_name: order.customer_name,
        vendor_name: order.vendor_name,
        material_name: material.name,
        order_item_reason: data.reason,
        ordered_qty: data.qty,
        received_qty,
        material_tags_name: materialTags.join(', '),
        created_by: order.user_created_by?.fullname || '',
        updated_by: order.user_updated_by?.fullname || '',
        status_updated_at: order.updated_at,
        updated_at: order.updated_at,
        batch_name: order_stocks[index]?.stock?.batch?.code || '',
        batch_expired_date: order_stocks[index]?.stock?.batch?.expired_date || '',
        quantity_per_batch: order_stocks[index]?.stock?.batch ? order_stocks[index].allocated_qty : '',
        delivery_number: order.delivery_number,
        no_document: order.no_document,
        released_date: order.released_date,
        notes: order.notes,
        service_type,
        comment_shipped: comment_shipped.join(';'),
        comment_fullfil: comment_fullfil.join(';'),
        confirmed_at: order.confirmed_at,
        allocated_at: order.allocated_at,
        shipped_at: order.shipped_at,
      }

      return item
    }

    next()
  } catch (err) {
    return next(err)
  }
}

export async function create(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const deviceID = req.headers['device-type']
    const device_type = DEVICE_TYPE[deviceID]

    if (req.user) {
      const { id } = req.user

      req.body = {
        ...req.body,
        created_by: id,
        updated_by: id,
      }
    }

    req.body = {
      ...req.body,
      status: ORDER_STATUS.PENDING, // first time create status pending
      device_type,
    }

    const { order_items: orderItems, order_tags: orderTags, order_comment: orderComment } = req.body

    let order = await models.Order.create(req.body, { transaction: t })

    if (orderComment) {
      await models.OrderComment.create({
        ...orderComment,
        order_id: order.id,
        user_id: req.user?.id || null,
        order_status: ORDER_STATUS.PENDING,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
      }, { transaction: t })
    }

    order.addOrder_tag(orderTags, { transaction: t })

    for (let j = 0; j < orderItems.length; j++) {
      const {
        material_id = null,
        ordered_qty = 0,
        recommended_stock = 0,
        reason_id,
        other_reason,
      } = orderItems[j]

      await models.OrderItem.create({
        material_id,
        recommended_stock,
        qty: ordered_qty,
        order_id: order.id,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
        reason_id,
        other_reason,
      }, { transaction: t })
    }

    await t.commit()

    order = await models.Order.findByPk(order.id)
    return res.status(201).json(order)
  } catch (err) {
    await t.rollback()
    console.error(err)
    return next(err)
  }
}

export async function update(req, res, next) {
  const orderId = req.params.id

  let order = await models.Order.findByPk(orderId)
  if (!order) return res.status(404).json({ message: req.__('404') })

  if (req.user) {
    const user_id = req.user.id
    req.body = {
      ...req.body,
      updated_by: user_id,
    }
  }

  if (req.user.entity_id === order.vendor_id) return res.status(403).json({ message: req.__('403') })

  const t = await models.sequelize.transaction()
  try {
    await models.Order.update(req.body, { where: { id: order.id } }, { transaction: t })
    order = await models.Order.findByPk(orderId)

    const { order_items: orderItems, order_tags: orderTags, order_comment: orderComment } = req.body

    if (orderComment) {
      await createComment({
        ...orderComment,
        user: req.user,
        order_id: order.id,
        status: order.status,
        created_by: req.user.id,
        updated_by: req.body.updated_by,
      })
    }

    if (Array.isArray(orderTags)) {
      const sourceTags = Array.isArray(order.order_tags) !== true ? [] : order.order_tags.forEach((tag) => tag.id)
      order.removeOrder_tag(sourceTags, { transaction: t })
      order.addOrder_tag(orderTags, { transaction: t })
    }
    // replace tags

    for (let k = 0; k < orderItems.length; k++) {
      const {
        id, ordered_qty, reason_id, other_reason,
      } = orderItems[k]
      const sourceOrderItem = await models.OrderItem.findByPk(id)
      if (sourceOrderItem) {
        const orderStock = await models.OrderStock.findOne({
          where: { order_item_id: sourceOrderItem.id },
        })
        if (orderStock) {
          await orderStock.update({ ordered_qty }, { transaction: t })
        }

        await sourceOrderItem.update({
          qty: ordered_qty, updated_by: req.body.updated_by, reason_id, other_reason,
        }, { transaction: t })
      }
    }

    await t.commit()

    order = await models.Order.findByPk(orderId)

    return res.status(200).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

async function getDetail(req, res, next) {
  try {
    const { id } = req.params
    let data = {}
    const options = {}

    options.include = {
      association: 'track_device',
      attributes: ['id', 'nopol', 'mobile_phone'],
      required: false,
    }
    options.without_items = true
    const items = await models.OrderItem.findAll({ where: { order_id: id }, with_stocks: true })
    data = await models.Order.findByPk(id, options)
    if (!data) throw { status: 404, message: req.__('404') }
    data.order_items = items
    data = mappingData({ data, req })

    data.order_tracking = null
    data.canvas_tracking = getCanvasUrl()

    if (data.track_device) {
      // get last position info
      const listNopol = [data.track_device.nopol]
      let easyGoData = {
        nopol: null,
        status: '',
        temperature: 0,
        timestamp: '',
      }
      await getLastPosition(listNopol, id).then(async (easyGoDataArr) => {
        if (easyGoDataArr[0]) easyGoData = easyGoDataArr[0]
        delete easyGoData.nopol
        let canvas_url = ''
        if (data.status === ORDER_STATUS.FULFILLED) {
          canvas_url = await getCanvasTrackingUrl({
            nopol: data.track_device.nopol,
            startDate: data.shipped_at,
            startEnd: data.fulfilled_at,
          })
        } else {
          canvas_url = await getCanvasUrl(data.track_device.nopol)
        }
        data.order_tracking = {
          ...easyGoData,
          canvas_url,
        }
      })
    }

    return data
  } catch (err) {
    return next(err)
  }
}

async function getDetailTwo(req, res, next) {
  try {
    const { id } = req.params
    let data = {}
    const options = {}

    options.include = [
      {
        association: 'track_device',
        attributes: ['id', 'nopol', 'mobile_phone'],
        required: false,
      },
    ]
    options.without_items = true
    const items = await models.OrderItem.getItemsOfOrder(id)

    data = await models.Order.findByPk(id, options)
    if (!data) throw { status: 404, message: req.__('404') }
    data.order_items = items
    data = mappingData({ data, req })

    data.order_tracking = null
    data.canvas_tracking = getCanvasUrl()

    if (data.track_device) {
      // get last position info
      const listNopol = [data.track_device.nopol]
      let easyGoData = {
        nopol: null,
        status: '',
        temperature: 0,
        timestamp: '',
      }
      await getLastPosition(listNopol, id).then(async (easyGoDataArr) => {
        if (easyGoDataArr[0]) easyGoData = easyGoDataArr[0]
        delete easyGoData.nopol
        let canvas_url = ''
        if (data.status === ORDER_STATUS.FULFILLED) {
          canvas_url = await getCanvasTrackingUrl({
            nopol: data.track_device.nopol,
            startDate: data.shipped_at,
            startEnd: data.fulfilled_at,
          })
        } else {
          canvas_url = await getCanvasUrl(data.track_device.nopol)
        }
        data.order_tracking = {
          ...easyGoData,
          canvas_url,
        }
      })
    }

    return data
  } catch (err) {
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    const data = await getDetail(req, res, next)

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}

export async function createCovid(req, res, next) {
  const t = await models.sequelize.transaction()

  try {
    const device_type = DEVICE_TYPE[req.headers['device-type']]
    const { user } = req
    let vendorId
    let customerId

    const customer = await models.Entity.findOne({
      where: { code: req.body.customer_code },
    })

    customerId = customer.id

    if (user) {
      if (user.role === USER_ROLE.SUPERADMIN) {
        const vendor = await models.Entity.findOne({
          where: { code: req.body.vendor_code },
        })
        vendorId = vendor.id
      } else {
        vendorId = req.user.entity_id
      }
      req.body = {
        ...req.body,
        created_by: req.user.id,
        updated_by: req.user.id,
      }
    }

    const {
      order_items: orderItems,
      is_allocated, type,
      order_comment: orderComment,
      order_tags: orderTags,
    } = req.body
    if (parseInt(type) === ORDER_TYPE.RETURN) {
      req.body.type = ORDER_TYPE.RETURN
    } else if (parseInt(type) === ORDER_TYPE.NORMAL) {
      req.body.type = ORDER_TYPE.NORMAL
    } else if (parseInt(type) === ORDER_TYPE.RUTIN_ALLOCATION) {
      req.body.type = ORDER_TYPE.RUTIN_ALLOCATION
    } else {
      req.body.type = ORDER_TYPE.DROPPING
    }

    req.body = {
      ...req.body,
      status: ORDER_STATUS.SHIPPED,
      customer_id: customerId,
      vendor_id: vendorId,
      confirmed_by: req.user.id,
      allocated_by: req.user.id,
      shipped_by: req.user.id,
      confirmed_at: new Date(),
      allocated_at: new Date(),
      shipped_at: new Date(),
      device_type,
    }

    if (is_allocated) {
      req.body.status = ORDER_STATUS.CONFIRMED
      req.body.shipped_by = null
      req.body.shipped_at = null
      req.body.allocated_at = null
      req.body.allocated_by = null
    }

    let order = await models.Order.create(req.body, { transaction: t })

    const orderCovidType = [ORDER_TYPE.DROPPING, ORDER_TYPE.RETURN]
    let orderTag = null
    if (orderCovidType.includes(parseInt(type))) {
      orderTag = await models.OrderTag.findByPk(4) // order tag covid 4
    } else {
      orderTag = orderTags
    }
    if (orderTag) {
      await order.addOrder_tag(orderTag, { transaction: t }) // adding tag covid to order covid
    }

    for (let i = 0; i < orderItems.length; i++) {
      const { material_code, batches, qty } = orderItems[i]
      let ordered_qty = qty

      if (Array.isArray(batches) && batches.length > 0) {
        ordered_qty = 0
        batches.forEach((el) => ordered_qty += parseInt(el.qty))
      }

      const material = await models.Material.findOne({
        where: { code: material_code },
      })

      const vendorMaterialEntity = await models.MaterialEntity.findOne({
        where: { material_id: material.id, entity_id: vendorId },
      })

      const orderItem = await models.OrderItem.create({
        qty: ordered_qty,
        confirmed_qty: ordered_qty,
        material_id: material.id,
        order_id: order.id,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
      }, { transaction: t })

      const transactionStock = {
        device_type,
        material_id: material.id,
        vendor_id: vendorId,
        customer_id: customerId,
        order_id: order.id,
      }

      if (Array.isArray(batches) && batches.length > 0) {
        for (let j = 0; j < batches.length; j++) {
          const batch = batches[j]

          const stock = {
            material_entity_id: vendorMaterialEntity.id,
            batch,
            ordered_qty: batch.qty,
            qty: batch.qty,
            order_item_id: orderItem.id,
            user_id: req.user.id,
          }

          await createVendorStock(stock, transactionStock, is_allocated, t)
        }
      } else if (!!qty === true) {
        const stock = {
          material_entity_id: vendorMaterialEntity.id,
          batch: null,
          ordered_qty: qty,
          qty,
          order_item_id: orderItem.id,
          user_id: req.user.id,
        }

        await createVendorStock(stock, transactionStock, is_allocated, t)
      }

      const customerMaterialEntity = await models.MaterialEntity.findOne({
        where: { material_id: material.id, entity_id: customerId },
      })
      if (!customerMaterialEntity) {
        await models.MaterialEntity.create({
          ..._.omit(vendorMaterialEntity.dataValues, ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by']),
          entity_id: customerId,
          created_by: req.user.id,
          updated_by: req.user.id,
        }, { transaction: t })
      }
    }

    if (orderComment) {
      await models.OrderComment.create({
        ...orderComment,
        order_id: order.id,
        user_id: req.user?.id || null,
        order_status: ORDER_STATUS.PENDING,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
      }, { transaction: t })
    }

    await t.commit()

    order = await models.Order.findByPk(order.id, {
      include: {
        association: 'activity',
        attributes: ['id', 'name'],
      }
    })
    if (!is_allocated) {
      await generateOrderNotification(order)
    }

    return res.status(201).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

async function createVendorStock(stock, transactionStock, is_allocated, t) {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        material_entity_id, batch, ordered_qty, qty, order_item_id, user_id,
      } = stock
      const {
        device_type, material_id, vendor_id, customer_id, order_id,
      } = transactionStock
      let batchId = null
      if (batch) {
        const {
          code, manufacture_name, expired_date, production_date,
        } = batch

        const manufacture = await models.Manufacture.findOne({
          where: { name: manufacture_name },
        })

        const sourceBatch = await models.Batch.findOne({
          where: { code, manufacture_id: manufacture.id },
        })

        if (sourceBatch) {
          await sourceBatch.update({
            production_date,
            manufacture_id: manufacture.id,
          })

          batchId = sourceBatch.id
        } else {
          const newBatch = await models.Batch.create({
            code,
            expired_date,
            production_date,
            manufacture_id: manufacture.id,
          })

          batchId = newBatch.id
        }
      }

      const vendorStock = await models.Stock.findOne({
        where: { batch_id: batchId, material_entity_id },
      }).then(async (findStock) => {
        if (!findStock) {
          findStock = await models.Stock.create({
            batch_id: batchId,
            material_entity_id,
            qty: 0,
            created_by: user_id,
            updated_by: user_id,
          })
        }
        return findStock
      })
      const issueTransaction = {
        device_type,
        change_qty: -Number(qty),
        opening_qty: vendorStock.qty,
        material_id,
        customer_id,
        vendor_id,
        entity_id: vendor_id,
        stock_id: vendorStock.id,
        transaction_type_id: TRANSACTION_TYPE.ISSUES,
        created_by: user_id,
        updated_by: user_id,
        order_id,
      }

      if (!is_allocated) {
        if (Number(vendorStock.qty) < qty) {
          const stockCountTransaction = JSON.parse(JSON.stringify(issueTransaction))
          stockCountTransaction.change_qty = Number(qty)
          stockCountTransaction.transaction_type_id = TRANSACTION_TYPE.STOCK_COUNT
          vendorStock.qty = Number(qty)
          await models.Transaction.create(stockCountTransaction, { transaction: t })
        }
        await models.Transaction.create(issueTransaction, { transaction: t })
      }

      if (vendorStock.qty !== 0 && !is_allocated) {
        const updateQty = Number(vendorStock.qty) - Number(qty)
        await vendorStock.update({
          qty: updateQty,
          updated_by: user_id,
        }, { transaction: t })
      }

      await models.OrderStock.create({
        ordered_qty,
        allocated_qty: qty,
        order_item_id,
        stock_id: vendorStock.id,
        created_by: user_id,
        updated_by: user_id,
      }, { transaction: t })

      resolve('done')
    } catch (err) {
      reject(err)
    }
  })
}

export async function insertComment(req, res, next) {
  try {
    let userId = null

    if (req.user) userId = req.user.id

    const { id: order_id } = req.params
    const order = await models.Order.findByPk(order_id)
    req.body = {
      ...req.body,
      order_id: req.params.id,
      user_id: userId,
      order_status: order.status,
    }
    next()
  } catch (err) {
    next(err)
  }
}

export async function createComment({
  order_id, user = {}, comment = '', status = null,
}, t) {
  try {
    return await models.OrderComment.create({
      comment,
      order_id,
      user_id: user?.id || null,
      order_status: status || null,
      created_by: user?.id || null,
      updated_by: user?.id || null,
    }, { transaction: t })
  } catch (err) {
    throw Error(err)
  }
}

export async function orderHistory(req, res, next) {
  try {
    const { id: order_id } = req.params
    req.condition = {
      order_id,
    }

    next()
  } catch (err) {
    return next(err)
  }
}

export async function insertOrderItem(req, res, next) {
  const t = await models.sequelize.transaction()
  const { id } = req.params
  const { order_items: orderItems } = req.body

  if (req.user) {
    req.body = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id,
    }
  }

  let order = await models.Order.findByPk(id)
  if (req.user.entity_id === order.vendor_id) return res.status(403).json({ message: req.__('403') })

  try {
    for (let i = 0; i < orderItems.length; i++) {
      const {
        material_id = null, ordered_qty = 0, batch_id = null, reason_id, other_reason,
      } = orderItems[i]
      const orderItem = await models.OrderItem.create({
        material_id,
        qty: ordered_qty,
        order_id: order.id,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
        reason_id,
        other_reason,
      }, { transaction: t })
      const materialEntity = await models.MaterialEntity.findOne({
        where: { material_id, entity_id: order.vendor_id },
      })
      let stock = await models.Stock.findOne({
        where: {
          batch_id,
          material_entity_id: materialEntity.id,
        },
      })
      if (!stock) { // if no stock will be created
        stock = await models.Stock.create({
          batch_id,
          material_entity_id: materialEntity.id,
          qty: 0,
          created_by: req.body.created_by,
          updated_by: req.body.updated_by,
        }, { transaction: t })
      }

      await models.OrderStock.create({
        ordered_qty,
        order_item_id: orderItem.id,
        stock_id: stock.id,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
      }, { transaction: t })
    }

    await t.commit()

    order = await models.Order.findByPk(id)
    return res.status(200).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

async function downloadStream(workbook, req, res, order) {
  const filename = `${req.workbookName.toUpperCase()} ${order.customer.name} ${order.created_at}`

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

export async function exportExcel(req, res, next) {
  try {
    const order = await getDetail(req, res, next)

    if (!req.workbook) {
      console.log('error')
      throw Error('error')
    }
    const workbook = await req.workbook(order)
    const filename = `${req.workbookName.toUpperCase()} ${order.customer.name} ${order.created_at}`

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
  } catch (error) {
    next(error)
  }
}

export async function exportExcelTwo(req, res, next) {
  try {
    const order = await getDetailTwo(req, res, next)

    if (!req.workbook) {
      console.log('error')
      throw Error('error')
    }
    const workbook = await req.workbook(order, req)

    return downloadStream(workbook, req, res, order)
  } catch (error) {
    next(error)
  }
}

export async function exportExcelWithOrderV2(req, res, next) {
  try {
    const { id } = req.params

    const order = await orderDetailV2(id, req)

    if (!req.workbook) {
      console.log('error')
      throw Error('error')
    }
    const workbook = await req.workbook(order, req)

    return downloadStream(workbook, req, res, order)
  } catch (error) {
    next(error)
  }
}

export async function listOrderDistributionCovid(req, res, next) {
  try {
    const {
      order_id,
      vendor_id,
      customer_id,
      status,
      to_date,
      from_date,
    } = req.query || {}
    const condition = [{
      type: ORDER_TYPE.DROPPING,
    }]

    if (order_id) condition.push({ id: Number(order_id) })
    if (status) condition.push({ status })
    if (vendor_id) condition.push({ vendor_id })
    if (customer_id) condition.push({ customer_id })
    if (from_date) {
      condition.push({
        created_at: {
          [Op.gte]: moment(`${from_date} 00:00:00`).toDate(),
        },
      })
    }
    if (to_date) {
      condition.push({
        created_at: {
          [Op.lte]: moment(`${to_date} 23:59:59`).toDate(),
        },
      })
    }

    req.condition = condition
    req.order = [['created_at', 'desc']]

    req.mappingDocs = ({ docs }) => docs.map((data) => {
      const { order_items = [] } = data
      let ordered_qty = 0; let
        allocated_qty = 0
      if (Array.isArray(order_items)) {
        order_items.forEach((order_item) => {
          if (order_item.qty) ordered_qty += order_item.qty
          order_item.order_stocks.forEach((order_stock) => {
            if (order_stock.allocated_qty) allocated_qty += order_stock.allocated_qty
          })
        })
      }
      return {
        id: data.id,
        status_label: data.status_label,
        created_at: data.created_at,
        vendor_name: data.vendor_name,
        vendor_type: data.vendor_type || 'Lainnya',
        customer_name: data.customer_name,
        order_description: data.order_description,
        qty_kpcpen: data.qty_kpcpen,
        allocated_qty,
        ordered_qty,
      }
    })

    next()
  } catch (err) {
    next(err)
  }
}

export async function listOrderReceiptionCovid(req, res, next) {
  try {
    let {
      order_id,
      vendor_id,
      customer_id,
      to_date,
      from_date,
      material_id,
      paginate,
      response_status,
    } = req.query || {}

    const condition = []

    const orderCondition = [
      { type: ORDER_TYPE.DROPPING },
      { status: ORDER_STATUS.FULFILLED },
    ]
    const covidLogCondition = [
      { worker_name: 'covid-api-update' },
    ]

    if (paginate > 100) paginate = 100
    if (order_id) condition.push({ order_id: Number(order_id) })
    if (material_id) condition.push({ material_id: Number(material_id) })
    if (vendor_id) orderCondition.push({ vendor_id })
    if (customer_id) orderCondition.push({ customer_id })
    if (from_date) {
      covidLogCondition.push({
        created_at: {
          [Op.gte]: moment(`${from_date} 00:00:00`).toDate(),
        },
      })
    }
    if (to_date) {
      covidLogCondition.push({
        created_at: {
          [Op.lte]: moment(`${to_date} 23:59:59`).toDate(),
        },
      })
    }
    if (response_status) covidLogCondition.push({ res_status: response_status })

    req.condition = condition
    req.include = [{
      association: 'order',
      attributes: ['id', 'submit_kpcpen_at', 'vendor_id', 'customer_id', 'created_at'],
      include: [
        { association: 'vendor', attributes: ['id', 'name'] },
        { association: 'customer', attributes: ['id', 'name'] },
      ],
      where: orderCondition,
      required: true,
    }, {
      association: 'material',
      attributes: ['id', 'name', 'is_vaccine'],
    }, {
      association: 'covid_log',
      on: {
        order_id: models.Sequelize.literal('`OrderItem`.`order_id` = `covid_log`.`order_id`'),
      },
      where: covidLogCondition,
      required: true,
    },
    {
      association: 'order_stocks',
      attributes: ['id', 'order_item_id', 'allocated_qty', 'received_qty'],
    }]
    req.order = [['created_at', 'desc']]
    req.customOptions = { without_relations: true }

    req.mappingDocs = ({ docs }) => Promise.all(docs.map(async (data) => {
      const { order_stocks = [], order } = data
      let received_qty = 0; let
        allocated_qty = 0
      if (Array.isArray(order_stocks)) {
        order_stocks.forEach((order_stock) => {
          if (order_stock.allocated_qty) allocated_qty += order_stock.allocated_qty
          if (order_stock.received_qty) received_qty += order_stock.received_qty
        })
      }

      const notificationLogs = data.covid_log
      return {
        vendor_name: order.vendor.name,
        customer_name: order.customer.name,
        material: data.material?.name || null,
        order_id: data.order_id,
        allocated_qty,
        received_qty,
        submit_kpcpen_at: order.submit_kpcpen_at,
        url: notificationLogs?.url || '',
        data_payload: notificationLogs?.payload || '',
        response_body: notificationLogs?.res_body || '',
        response_status: notificationLogs?.res_status || '',
        created_at: notificationLogs?.created_at || '',
        updated_at: notificationLogs?.updated_at || '',
        order: data.order,
      }
    }))

    next()
  } catch (err) {
    console.log(err)
    next(err)
  }
}

export function setWorkbook(workbook) {
  return async function (req, res, next) {
    switch (workbook) {
      case 'sbbk':
        req.workbook = suratBuktiBarangKeluar
        break
      case 'var':
        req.workbook = varReport
        break
    }
    req.workbookName = workbook
    next()
  }
}

export function setWorkbookTwo(workbook) {
  return async function (req, res, next) {
    switch (workbook) {
      case 'sbbk':
        req.workbook = suratBuktiBarangKeluarTwo
        req.workbookName = req.__('report_header.sbbk.head1')
        break
      case 'var':
        req.workbook = process.env.APP_SERVICE === 'logistic' ? varReportLogistic : varReportTwo
        req.workbookName = process.env.APP_SERVICE == 'logistic' ? 'Surat Bukti Penerimaan' : workbook
        break
      case 'requirement':
        req.workbook = requirementLetter
        req.workbookName = workbook
        break
      case 'nota-batch':
        req.workbook = notaBatch
        req.workbookName = workbook
        break
      case 'nota-confirmation':
        req.workbook = notaConfirmation
        req.workbookName = workbook
        break
      case 'laporan penerimaan':
        req.workbook = reportPenerimaan
        req.workbookName = workbook
    }
    next()
  }
}
