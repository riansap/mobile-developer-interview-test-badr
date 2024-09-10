import {
  DEVICE_TYPE,
  ENTITY_TYPE,
  EXTERMINATION_ORDER_TYPE,
  EXTERMINATION_TRANSACTION_TYPE,
  ORDER_STATUS,
  USER_ROLE,
  getOrderStatusLabel,
  getOrderTypeLabel
} from '../../../helpers/constants'

import { Op } from 'sequelize'

import models from '../../../models'

import { formatRelationsCount, formatWIB } from '../../../helpers/common'
import listResponse from '../../../helpers/listResponse'

import Excel from 'exceljs'

export async function independent(req, res, next) {
  const device_type = DEVICE_TYPE[req.headers['device-type']]
  const { user } = req
  let vendorId
  let customerId

  const customer = await models.Entity.findOne({
    where: { code: req.body.customer_code },
  })

  if (!customer) return res.status(400).json({ message: 'Invalid customer_code' })

  customerId = customer.id

  let vendor = req.user.entity
  if (user.role === USER_ROLE.SUPERADMIN) {
    vendor = await models.Entity.findOne({
      where: { code: req.body.customer_code },
    })
    if (!vendor) return res.status(400).json({ message: 'Invalid vendor_code' })
    vendorId = vendor.id
  } else {
    vendorId = req.user.entity_id
  }

  const {
    order_items: orderItems,
    order_comment: orderComment,
    flow_id
  } = req.body

  req.body.type = EXTERMINATION_ORDER_TYPE.INDEPENDENT_EXTERMINATION

  req.body = {
    ...req.body,
    status: ORDER_STATUS.INDEPENDENT_EXTERMINATION,
    customer_id: vendorId,
    vendor_id: vendorId,
    confirmed_by: null,
    allocated_by: null,
    shipped_by: user.id,
    confirmed_at: null,
    allocated_at: null,
    shipped_at: new Date(),
    device_type,
    created_by: user.id,
    updated_by: user.id,
  }

  const t = await models.sequelize.transaction()
  try {
    let order = await models.Order.create(req.body, { transaction: t })

    for (let i = 0; i < orderItems.length; i++) {
      const { stocks, ordered_qty, material_id } = orderItems[i]


      const vendorMaterialEntity = await models.EntityMasterMaterial.findOne({
        where: { master_material_id: material_id, entity_id: vendorId },
      })

      const orderItem = await models.OrderItem.create({
        qty: ordered_qty,
        confirmed_qty: ordered_qty,
        master_material_id: material_id,
        order_id: order.id,
        created_by: user.id,
        updated_by: user.id,
      }, { transaction: t })

      let orderStockExterminationPayloads = []

      for (let stock of stocks) {
        const orderStock = await models.OrderStock.create({
          order_item_id: orderItem.id,
          stock_id: stock.stock_id,
          allocated_qty: stock.stock_qty,
          created_by: user.id,
          updated_by: user.id,
        }, { transaction: t })

        for (let stockExtermination of stock.stock_exterminations) {
          orderStockExterminationPayloads.push({
            order_stock_id: orderStock.id,
            status: ORDER_STATUS.INDEPENDENT_EXTERMINATION,
            stock_extermination_id: stockExtermination.stock_extermination_id,
            allocated_discard_qty: stockExtermination.discard_qty,
            allocated_received_qty: stockExtermination.received_qty,
          })


          let existingStockExtermination = await models.StockExtermination.findByPk(stockExtermination.stock_extermination_id, { transaction: t })
          if (!existingStockExtermination) {
            await t.rollback()
            return res.status(422).json({ error: 'Extermination stock not found' })
          }
          await models.ExterminationTransaction.create({
            extermination_transaction_type_id: EXTERMINATION_TRANSACTION_TYPE.INDEPENDENT_EXTERMINATION,
            flow_id: flow_id,
            master_material_id: material_id,
            activity_id: stock.activity_id,
            customer_id: vendorId,
            vendor_id: vendorId,
            entity_id: vendorId,
            stock_extermination_id: stockExtermination.stock_extermination_id,
            order_id: order.id,
            opening_qty: Number(existingStockExtermination.extermination_discard_qty) + Number(existingStockExtermination.extermination_received_qty),
            change_qty: -Number(stockExtermination.discard_qty + stockExtermination.received_qty),
            created_by: user.id,
            updated_by: user.id,
          }, { transaction: t })

          existingStockExtermination.extermination_qty += stockExtermination.discard_qty + stockExtermination.received_qty
          existingStockExtermination.extermination_discard_qty -= stockExtermination.discard_qty
          existingStockExtermination.extermination_received_qty -= stockExtermination.received_qty

          if (existingStockExtermination.stock_id !== stock.stock_id) {
            await t.rollback()
            return res.status(400).json({ error: req.__('validator.exists', { field: req.__('extermination') }) })
          }
          if (existingStockExtermination.extermination_discard_qty < 0) {
            await t.rollback()
            return res.status(400).json({ error: req.__('validator.not_empty', { field: 'existing discard_qty' }) })
          }
          if (existingStockExtermination.extermination_received_qty < 0) {
            await t.rollback()
            return res.status(400).json({ error: req.__('validator.not_empty', { field: 'existing received_qty' }) })
          }

          await existingStockExtermination.save({ transaction: t })
        }
      }

      await models.OrderStockExtermination.bulkCreate(orderStockExterminationPayloads, { transaction: t })

      const customerMaterialEntity = await models.EntityMasterMaterial.findOne({
        where: { master_material_id: material_id, entity_id: customerId },
      })
      if (!customerMaterialEntity) {
        await models.EntityMasterMaterial.create({
          ..._.omit(vendorMaterialEntity.dataValues, ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by']),
          entity_id: customerId,
          created_by: user.id,
          updated_by: user.id,
        }, { transaction: t })
      }
    }

    if (orderComment) {
      await models.OrderComment.create({
        ...orderComment,
        order_id: order.id,
        user_id: user.id,
        order_status: ORDER_STATUS.INDEPENDENT_EXTERMINATION,
        created_by: user.id,
        updated_by: user.id,
      }, { transaction: t })
    }

    await t.commit()

    order = await models.Order.findByPk(order.id, {
      include: {
        association: 'activity',
        attributes: ['id', 'name'],
      }
    })

    order.device_type = device_type
    order.save()

    return res.status(201).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}


export async function filter(req, res, next) {
  try {
    const condition = []
    let {
      keyword,
      flow_id,
      material_id,
      material_ids,
      extermination_transaction_type_id,
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
      order_status,
      entity_tag_id,
      customer_tag_id,
      is_vaccine,
      entity_id,
      province_id,
      regency_id,
      sub_district_id,
    } = req.query

    const whereCustomerVendor = {}
    if (is_consumption) whereCustomerVendor.is_consumption = is_consumption
    else if (is_distribution) whereCustomerVendor.is_distribution = is_distribution

    if (is_order === '1') {
      condition.push({ order_id: { [Op.not]: null } })
    } else if (is_order === '0') {
      condition.push({ order_id: { [Op.is]: null } })
    }
    let entityTag; let
      customerTag = {}
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

    req.include = [
      {
        association: 'stock_extermination',
        attributes: models.StockExtermination.getBasicAttributes(),
        include: [
          {
            association: 'transaction_reason',
            attributes: ['id', 'title', 'is_other'],
          },
          {
            association: 'stock',
            attributes: [...models.Stock.getWastageAttributes()],
            include: [
              {
                association: 'batch',
                attributes: models.Batch.getBasicAttribute(),
                include: { association: 'manufacture', attributes: ['id', 'name', 'address'] },
              },
              {
                association: 'entity_master_material',
                attributes: models.EntityMasterMaterial.getBasicAttribute(),
              },
              {
                association: 'activity',
                attributes: ['id', 'name'],
              }
            ]
          },
        ],
      },
      {
        association: 'entity',
        attributes: ['id', 'name', 'address'],
        include: [
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
        ],
        ...entityTag,
      },
      {
        association: 'master_material',
        attributes: ['id', 'name', 'is_vaccine', 'is_openvial', 'managed_in_batch'],
        required: true,
      },
      {
        association: 'flow',
        attributes: ['id', 'title']
      },
      {
        association: 'activity',
        attributes: ['id', 'name']
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
        association: 'extermination_transaction_type',
        attributes: models.ExterminationTransactionType.getBasicAttribute(),
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
        attributes: ['id', 'device_type', 'status', 'no_document', 'created_by', 'updated_by'],
        paranoid: false,
        include: {
          association: 'order_comments',
          attributes: ['comment', 'order_status'],
        },
      },
    ]
    if (JSON.stringify(whereCustomerVendor) !== '{}') {
      req.include.push(
        {
          association: 'customer_vendor',
          where: whereCustomerVendor,
        },
      )
    }

    const role = Number(req.user.role)
    const onlySelfRole = [
      USER_ROLE.OPERATOR,
      USER_ROLE.OPERATOR_COVID,
      USER_ROLE.PKC,
    ]
    const deviceType = req.headers['device-type'] ? DEVICE_TYPE[req.headers['device-type']] : DEVICE_TYPE.web
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
    else if (material_ids) {
      //   let materialIds = String(material_ids).split(',')
      //   materialIds = materialIds.forEach((item) => Number(String(item).trim()))
      //   condition.push({ master_material_id: materialIds })
    }
    if (extermination_transaction_type_id) {
      let transactionTypeIds = String(extermination_transaction_type_id).split(',')
      transactionTypeIds = transactionTypeIds.map((item) => Number(String(item).trim()))
      if (transactionTypeIds) condition.push({ extermination_transaction_type_id: transactionTypeIds })
    }

    if (keyword) condition.push({ '$master_material.name$': { [Op.like]: `%${keyword}%` } })
    if (entity_tag_id) condition.push({ '$entity.entity_tags.id$': entity_tag_id })
    if (customer_tag_id) condition.push({ '$customer.entity_tags.id$': customer_tag_id })
    if (transaction_reason_id) condition.push({ '$stock_extermination.transaction_reason_id$': transaction_reason_id })
    if (flow_id) condition.push({ flow_id })
    if (vendor_id) condition.push({ vendor_id })
    if (customer_id) condition.push({ customer_id })
    if (start_date) condition.push({ createdAt: { [Op.gte]: start_date } })
    if (end_date) condition.push({ createdAt: { [Op.lte]: end_date } })
    if (entity_id) condition.push({ entity_id: entity_id })
    if (activity_id) condition.push({ activity_id })
    if (order_type) condition.push({ '$order.type$': order_type })
    if (order_status) condition.push({ '$order.status$': order_status })
    if (is_vaccine) condition.push({ '$master_material.is_vaccine$': is_vaccine })

    if (JSON.stringify(condition) !== '{}') req.condition = condition
    req.order = [['id', 'desc']]
    req.customOptions = { subQuery: false }

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function customList(req, res, next) {
  try {
    const lang = req.headers['accept-language'] || 'id'
    const { page = 1, paginate = 10 } = req.query
    let checkParam = 0
    for (var key in req.query) {
      if (key !== 'page' && key !== 'paginate' && key !== 'size' && key !== 'lang') {
        if (req.query[key] !== '') {
          checkParam++
        }
      }
    }
    if (checkParam === 0) {
      throw { status: 204, message: req.__('204') }
    }
    const {
      condition = {},
      attributes,
      order,
      include,
      customOptions,
    } = req

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

    docs = await models.ExterminationTransaction.findAll(options)
    const countOptions = {
      ...options,
      include: formatRelationsCount(options.include, condition),
    }
    // include master_material & activity relations
    countOptions.include = [options.include[2], options.include[3], ...countOptions.include]
    total = await models.ExterminationTransaction.count({ ...countOptions, subQuery: false })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    const virtual = models.ExterminationTransaction.getVirtualAttribute()
    docs = docs.map(data => {
      let newData = {
        ...data.dataValues,
      }
      virtual.forEach(v => newData[v] = data[v])
      let statusName
      switch (data.order.status) {
      case ORDER_STATUS.FULFILLED:
        statusName = req.__('field.status.fulfilled')
        break
      case ORDER_STATUS.CANCELED:
        statusName = req.__('field.status.canceled')
        break
      case ORDER_STATUS.INDEPENDENT_EXTERMINATION:
        if (data.flow_id === 2) {
          statusName = null
        } else {
          statusName = req.__('field.status.unreceived')
        }
        break
      case ORDER_STATUS.SHIPPED:
        statusName = req.__('field.status.shipped')
        break
      }

      data.material = data.master_material
      data.change_qty = Math.abs(data.change_qty)
      data.order.status = {
        id: data.order.status,
        title: statusName
      }
      delete data.master_material

      let title = data.stock_extermination.transaction_reason.title?.trim()
      data.stock_extermination.transaction_reason.title = lang == 'en' ? req.__(`field.transaction_reason.list.${title}`) : title

      let type = data.extermination_transaction_type.title?.trim()
      data.extermination_transaction_type.title = lang == 'en' ? req.__(`field.transaction_type.list.${type}`) : type

      let flow = data.flow.id
      data.flow.title = lang == 'en' ? req.__(`field.flow.list.${flow}`) : flow

      return data
    })

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

function setWorkbook(req) {
  const workbook = new Excel.Workbook()
  const viewsOptions = [
    {
      x: 0, y: 0, width: 10000, height: 20000,
      firstSheet: 0, activeTab: 1, visibility: 'visible'
    }
  ]

  let lang = req.headers['accept-language'] || 'id'

  const xls_headers = {
    entity_id: { id: 'ID Entitas', en: 'Entity ID' },
    entity_name: { id: 'Nama Entitas', en: 'Entity Name' },
    material_id: { id: 'ID Material', en: 'Material ID' },
    material_name: { id: 'Nama Material', en: 'Material Name' },
    activity_name: { id: 'Nama Aktivitas', en: 'Activity Name' },
    opening_stock: { id: 'Stok Pembuka', en: 'Opening Stock' },
    qty: { id: 'Kuantitas', en: 'Quantity' },
    closing_stock: { id: 'Penutupan Stok', en: 'Closing Stock' },
    transaction_type: { id: 'Tipe Transaksi', en: 'Transaction Type' },
    flow_type: { id: 'Tipe Aliran', en: 'Flow Type' },
    transaction_reason: { id: 'Alasan Transaksi', en: 'Transaction Reason' },
    customer_name: { id: 'Nama Pelanggan', en: 'Customer Name' },
    vendor_name: { id: 'Nama Penyedia', en: 'Vendor Name' },
    pmm: {id : 'No. PMM', en: 'No. PMM'},
    //order_id: { id: 'ID Order', en: 'Order ID' },
    order_status: { id: 'Status Order', en: 'Order Status' },
    order_type: { id: 'Tipe Order', en: 'Order Type' },
    taken_from_activities: { id: 'Diambil dari Aktivitas', en: 'Taken from Activities' },
    batch_code: { id: 'Kode Batch', en: 'Batch Code' },
    batch_expiry: { id: 'Kadaluwarsa', en: 'Batch Expiry' },
    batch_manufacture: { id: 'Pabrik Batch', en: 'Batch Manufacture' },
    created_by_fullname: { id: 'Dibuat Oleh', en: 'Created by Full Name' },
    created_at: { id: 'Tanggal Dibuat', en: 'Created At' },
    document_no: { id: 'Nomor Dokument', en: 'No. Document' },
   
  }

  let xlsColumns = []

  for (let key in xls_headers) {
    xlsColumns.push({ key: key, title: xls_headers[key][lang] || xls_headers[key]['id'] })
  }

  workbook.creator = 'SMILE'
  workbook.views = viewsOptions

  const worksheet = workbook.addWorksheet('Lists', {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: { firstHeader: 'Stock', firstFooter: 'Stock' }
  })

  const keyColumn = xlsColumns.map(item => { return { key: item.key } })
  worksheet.columns = keyColumn

  const titleColumns = xlsColumns.map(item => {
    if (item.title) return item.title
    return item.key
  })

  worksheet.addRow(titleColumns)

  let docs = req.docs ? req.docs : []

  let get_translated = function (title, lang = 'id') {
    let vocabs = {
      'pengeluaran': 'Shipped',
      'penerimaan': 'Received',
      'pemusnahan mandiri': 'Independent Extermination',
      'c. pemusnahan mandiri': 'C. Independent Extermination',
      'b. uji coba': 'B. Trials',
      'a. pengiriman pemusnahan': 'A. Extermination Delivery'
    }

    return lang == 'en' ? vocabs[title.toLowerCase().trim()] : title
  }

  for (let data of docs) {
    let item = {
      entity_id: data.entity_id,
      entity_name: data?.entity?.name,
      material_id: data.master_material_id,
      material_name: data?.master_material?.name || '',
      activity_name: data?.activity?.name || '',
      opening_stock: data.opening_qty,
      qty: data.change_qty,
      closing_stock: Number(data.opening_qty) + Number(data.change_qty),
      transaction_type: get_translated(data?.extermination_transaction_type?.title, lang) || '',
      flow_type: get_translated(data?.flow?.title, lang) || '',
      transaction_reason: (lang == 'en' ? req.__(`field.transaction_reason.list.${data?.stock_extermination?.transaction_reason?.title}`) : data?.stock_extermination?.transaction_reason?.title) || '',
      customer_name: data?.customer?.name || '',
      vendor_name: data?.vendor?.name || '',
      pmm: `PMM-${data?.id}`,
      //order_id: data.order_id,
      order_status: data?.order?.status ? getOrderStatusLabel(data?.order?.status, lang) || '' : '',
      order_type: data?.order?.type ? getOrderTypeLabel(data?.order?.type, lang) || '' : '',
      taken_from_activities: data?.stock_extermination?.stock?.activity?.name || '',
      batch_code: data?.stock_extermination?.stock?.batch?.code || '',
      batch_expiry: data?.stock_extermination?.stock?.batch?.expired_date ? formatWIB(data?.stock_extermination?.stock?.batch?.expired_date) : '',
      batch_manufacture: data?.stock_extermination?.stock?.batch?.manufacture?.name || '',
      created_by_fullname: data?.user_created ? data?.user_created?.firstname + ' ' + (data?.user_created?.lastname || '') : '',
      created_at: data.createdAt ? formatWIB(data.createdAt) : '',
      document_no: data?.order?.no_document || ''
    }

    worksheet.addRow(item)
  }

  return workbook

}

export async function formatXLS(req, res, next) {
  try {
    let lang = req.headers['accept-language'] || 'id'
    let checkParam = 0
    for (var key in req.query) {
      if (key !== 'page' && key !== 'paginate' && key !== 'size' && key !== 'lang') {
        if (req.query[key] !== '') {
          checkParam++
        }
      }
    }
    if (checkParam === 0) {
      throw { status: 204, message: req.__('204') }
    }
    const {
      condition = {},
      attributes,
      order,
      include,
      customOptions,
    } = req

    const options = {
      order,
      attributes,
      where: condition,
      duplicating: false,
      ...customOptions,
    }
    if (include && typeof include === 'object') options.include = include
    options.include.push({
      association: 'order',
      attributes: ['id', 'status', 'type', 'no_document']
    })
    let docs = []
    let total = 10

    docs = await models.ExterminationTransaction.findAll(options)
    const countOptions = {
      ...options,
      include: formatRelationsCount(options.include, condition),
    }
    // include master_material & activity relations
    countOptions.include = [options.include[2], options.include[3], ...countOptions.include]
    total = await models.ExterminationTransaction.count({ ...countOptions, subQuery: false })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    const virtual = models.ExterminationTransaction.getVirtualAttribute()
    docs = docs.map(data => {
      let newData = {
        ...data.dataValues,
      }
      virtual.forEach(v => newData[v] = data[v])
      //data.material = data.master_material
      //delete data.master_material
      return data
    })

    const currentDate = new Date()
    const filename = {
      id: 'Pemusnahan Mandiri',
      en: 'Independent Disposal'
    }
    req.xlsFilename = `${filename[lang] || filename['id']} ${currentDate}`
    req.docs = docs
    req.workbook = setWorkbook

    next()
  } catch (err) {
    return next(err)
  }
}