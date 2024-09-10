import { Op } from 'sequelize'
import stream from 'stream'
import JSZip from 'jszip'
import moment from 'moment'
import models from '../models'
import errorResponse from '../helpers/errorResponse'
import { publishWorker } from '../helpers/services/rabbitmqHelper'
import { formatUpdateTransactionPayload } from '../helpers/integrations/covidIntegrationHelper'
import { generateMaterialNotification } from '../helpers/notifications/notificationService'
import { transactionLogBook, commonLists } from '../helpers/xls/excelTemplate'
import {
  TRANSACTION_TYPE, ENTITY_TYPE, DEVICE_TYPE, getStockStatusLabel, USER_ROLE,
} from '../helpers/constants'
import { groupByKey, formatRelationsCount } from '../helpers/common'
import listResponse from '../helpers/listResponse'

const {
  Stock, Batch, Transaction, TransactionInjection, sequelize, MaterialEntity, TransactionType, User, Entity,
} = models

export async function list(req, res, next) {
  try {
    const condition = []
    const {
      keyword,
      material_id,
      material_ids,
      transaction_type_id,
      start_date,
      end_date,
      vendor_id,
      material_tag_id,
      transaction_reason_id,
      customer_id,
      is_consumption,
      is_distribution,
      is_order,
      order_type,
      entity_tag_id,
      customer_tag_id,
      is_vaccine,
    } = req.query
    let {
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
        association: 'stock',
        attributes: Stock.getBasicAttribute(),
        include: [
          {
            association: 'batch',
            attributes: Batch.getBasicAttribute(),
            include: { association: 'manufacture', attributes: ['id', 'name', 'address'] },
          },
          {
            association: 'material_entity',
            attributes: MaterialEntity.getBasicAttribute(),
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
        association: 'material',
        attributes: ['id', 'name', 'description', 'is_vaccine'],
        include: [
          {
            association: 'material_tags',
            attributes: ['title', 'id'],
          },
        ],
        required: true,
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
        attributes: TransactionType.getBasicAttribute(),
      },
      {
        association: 'transaction_reason',
        attributes: ['id', 'title', 'is_other'],
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
        attributes: ['id', 'type'],
      },
      {
        association: 'injection',
        attributes: ['id', 'dose_1', 'dose_2', 'dose_booster', 'dose_routine'],
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
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN) {
      const currentEntity = req.user.entity
      if (!province_id) province_id = currentEntity.province_id
      if (!regency_id) regency_id = currentEntity.regency_id
      if (!sub_district_id) sub_district_id = currentEntity.sub_district_id

      if (onlySelfRole.includes(role)) {
        entity_id = req.entityID
      }
    }

    const entityCondition = []
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entityCondition.length > 0) {
      req.include[1].where = entityCondition
    }

    if (material_id) condition.push({ material_id })
    else if (material_ids) {
      let materialIds = String(material_ids).split(',')
      materialIds = materialIds.forEach((item) => Number(String(item).trim()))
      condition.push({ material_id: materialIds })
    }
    if (transaction_type_id) {
      let transactionTypeIds = String(transaction_type_id).split(',')
      transactionTypeIds = transactionTypeIds.map((item) => Number(String(item).trim()))
      if (transactionTypeIds) condition.push({ transaction_type_id: transactionTypeIds })
    }

    if (keyword) condition.push({ '$material.name$': { [Op.like]: `%${keyword}%` } })
    if (entity_tag_id) condition.push({ '$entity.entity_tags.id$': entity_tag_id })
    if (customer_tag_id) condition.push({ '$customer.entity_tags.id$': customer_tag_id })
    if (transaction_reason_id) condition.push({ transaction_reason_id })
    if (vendor_id) condition.push({ vendor_id })
    if (customer_id) condition.push({ customer_id })
    if (start_date) condition.push({ createdAt: { [Op.gte]: start_date } })
    if (end_date) condition.push({ createdAt: { [Op.lte]: end_date } })
    if (entity_id) condition.push({ entity_id })
    if (material_tag_id) condition.push({ '$material.material_tags.id$': material_tag_id })
    if (order_type) condition.push({ '$order.type$': order_type })
    if (is_vaccine) condition.push({ '$material.is_vaccine$': is_vaccine })

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
    const { page = 1, paginate = 10 } = req.query
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

    docs = await Transaction.findAll(options)
    const countOptions = {
      ...options,
      include: formatRelationsCount(options.include, condition),
    }
    total = await Transaction.count({ ...countOptions, subQuery: false })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

export async function submit(req, res, next) {
  try {
    let { entityID } = req
    const deviceID = req.headers['device-type']
    const transactions = req.body
    const transactionCovid = []
    const notifMaterialEntities = []
    const user = await User.findByPk(req.user.id)

    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index]
      if (user.role === USER_ROLE.SUPERADMIN) {
        entityID = transaction.entity_id
      }
      // validate transaction object
      const materialEntity = await MaterialEntity.findOne({
        where: {
          material_id: transaction.material_id,
          entity_id: entityID,
        },
        include: {
          association: 'material',
        },
        with_stocks: true,
      })
      if (!materialEntity) {
        throw { status: 422, message: req.__('validator.not_exist', { field: req.__('field.id.material_id') }) }
      }
      const transactionType = await TransactionType.findOne({
        where: { id: transaction.transaction_type_id },
      })
      if (!transactionType) {
        throw { status: 422, message: req.__('validator.not_exist', { field: req.__('field.id.transaction_type_id') }) }
      }

      // Begin input
      let oldBatch = null
      if (transaction.batch) {
        oldBatch = await Batch.findOne({ where: { code: transaction.batch.code } })
      }

      let stockCondition = oldBatch ? [{ batch_id: oldBatch.id }, { material_entity_id: materialEntity.id }] : { id: transaction.stock_id || null }
      if (!transaction.batch && !transaction.stock_id) stockCondition = { material_entity_id: materialEntity.id }

      const t = await sequelize.transaction()
      let stock = await Stock.findOne({
        where: stockCondition,
        lock: true,
        transaction: t,
      })
      const changeQty = transactionType.can_remove ? -Math.abs(transaction.change_qty) : transaction.change_qty
      const currentQty = stock?.qty || 0
      let openingStock = 0
      const newQty = transactionType.can_restock ? changeQty : currentQty + changeQty
      const stockField = {
        qty: newQty,
        status: transaction.status_id,
        updated_by: req.user.id,
      }
      try {
        if (stock) {
          if (transactionType.can_remove && transaction.change_qty > stock.qty) {
            throw {
              status: 422,
              message: (req.__('validator.lesser_or_equal', {
                field1: `${req.__('field.transaction.change_qty')} (${transaction.change_qty})`,
                field2: `${req.__('field.stock.qty')} (${stock.qty || 0})`,
              })),
            }
          }
          // Update Stock by transaction type
          openingStock = stock.qty
          await stock.update(stockField, { transaction: t })
        } else if (!stock && !transaction.stock_id) {
          // Stock not found, create a new one
          let batch = null
          // Stock in same batch as previous data
          if (transaction.batch && transaction.is_batches) {
            if (!oldBatch) {
              batch = await Batch.create(transaction.batch, { transaction: t })
            } else {
              batch = oldBatch
            }
          }
          stockField.batch_id = batch ? batch.id : null
          stockField.created_at = transaction.created_at || null
          stockField.created_by = req.user.id
          stockField.material_entity_id = materialEntity.id

          stock = await Stock.create(stockField, { transaction: t })
        } else {
          throw { status: 422, message: res.__('validator.not_exist', { field: res.__('field.id.stock_id') }) }
        }
        // create transaction
        transaction.stock_id = stock.id
        transaction.entity_id = entityID
        transaction.opening_qty = openingStock
        transaction.device_type = DEVICE_TYPE[deviceID]
        transaction.created_by = req.user.id
        transaction.change_qty = changeQty
        transaction.updated_by = req.user.id
        transaction.status = transaction.status_id
        transaction.createdAt = transaction.created_at
        if (transaction.transaction_type_id === TRANSACTION_TYPE.RETURN) {
          transaction.transaction_broken_reason = transaction.transaction_reason_id
          transaction.transaction_reason_id = null
        }
        const result = await Transaction.create(transaction, { transaction: t })
        if (transaction.transaction_type_id === TRANSACTION_TYPE.ISSUES) {
          let injectionData = {}
          injectionData.dose_1 = transaction.dose_1
          injectionData.dose_2 = transaction.dose_2
          injectionData.dose_booster = transaction.booster
          injectionData.dose_routine = transaction.dose_routine
          injectionData.transaction_id = result.id
          await TransactionInjection.create(injectionData, { transaction: t })
        }

        if (transaction.transaction_type_id === TRANSACTION_TYPE.ISSUES
        || transaction.transaction_type_id === TRANSACTION_TYPE.DISCARDS) {
          transactionCovid.push({
            id: result.id,
            entity_id: req.entityID,
            ...transaction,
          })
        }

        if (transaction.transaction_type_id === TRANSACTION_TYPE.RETURN && transaction.broken_qty) {
          // create broken qty transaction.broken_qty
          // remove stock by broken
          const finalQty = newQty - transaction.broken_qty
          await stock.update({
            qty: finalQty,
            updated_by: req.user.id,
          }, { transaction: t })
          const transactionBroken = {
            ...transaction,
            opening_qty: newQty,
            change_qty: -Math.abs(transaction.broken_qty),
            transaction_type_id: TRANSACTION_TYPE.DISCARDS,
            transaction_reason_id: transaction.transaction_broken_reason,
          }
          const resId = await Transaction.create(transactionBroken, { transaction: t })
          transactionCovid.push({
            id: resId.id,
            entity_id: req.entityID,
            ...transactionBroken,
          })
        }

        await t.commit()

        notifMaterialEntities.push({ id: materialEntity.id, oldStock: materialEntity.on_hand_stock })
      } catch (error) {
        await t.rollback()
        throw error
      }
    }
    if (notifMaterialEntities.length > 0) {
      await generateMaterialNotification(req.timezone, [user.id], notifMaterialEntities)
    }
    // send data to kpcpen
    const payloadUpdate = await formatUpdateTransactionPayload(transactionCovid)
    if (payloadUpdate.length && req.user.role === USER_ROLE.OPERATOR_COVID) {
      payloadUpdate.forEach((payload) => {
        console.log(JSON.stringify(payloadUpdate))
        publishWorker('covid-api-update', payload)
      })
    }

    return res.status(200).json({ message: req.__('201') })
  } catch (err) {
    console.log(err)
    return next(err)
  }
}

export async function updateDose(req, res, next) {
  try {
    const { id } = req.params
    let data = req.body
    let injection = await TransactionInjection.findOne({ where: { transaction_id: id } })
    let transaction = await Transaction.findOne({ where: { id: id } })
    if (!transaction) {
      throw { status: 422, message: res.__('validator.not_exist', { field: res.__('field.transaction.id') }) }
    }

    let injectionData = {}
    injectionData.dose_1 = data.dose_1
    injectionData.dose_2 = data.dose_2
    injectionData.dose_booster = data.dose_booster
    injectionData.dose_routine = data.dose_routine
  
    if (injection) {
      await injection.update(injectionData)
    } else {
      injectionData.transaction_id = transaction.id
      await TransactionInjection.create(injectionData)
    }

    return res.status(200).json({ message: req.__('201') })
  } catch (err) {
    console.log(err)
    return next(err)
  }
}

async function getExportExcelByEntityData(query, res) {
  const { entity_id, month, year } = query

  const data = []

  const materialEntities = await MaterialEntity.findAll({
    where: {
      entity_id,
    },
    include: {
      association: 'stocks',
      required: true,
      include: [
        {
          association: 'transactions',
          include: [
            {
              association: 'customer',
              attributes: ['id', 'name'],
            },
            {
              association: 'vendor',
              attributes: ['id', 'name'],
            },
            {
              association: 'material',
              attributes: ['id', 'code', 'name', 'description', 'is_vaccine'],
            },
            {
              association: 'transaction_type',
              attributes: TransactionType.getBasicAttribute(),
            },
            {
              association: 'transaction_reason',
              attributes: ['id', 'title', 'is_other'],
            },
            {
              association: 'entity',
              attributes: ['id', 'name', 'address'],
            },
          ],
          required: true,
        },
        {
          association: 'batch',
        },
      ],
    },
  })

  if (!materialEntities) return res.status(404).json(errorResponse('Data tidak ditemukan'))

  const allTransactions = []
  materialEntities.forEach((materialEntity) => {
    materialEntity.stocks.forEach((stock) => {
      stock.transactions.forEach((transaction) => {
        const data = {
          transaction,
          stock,
        }

        allTransactions.push(data)
      })
    })
  })

  const transactionRowData = []
  const stockBatches = []
  const stockNonBatch = []

  for (let index = 0; index < allTransactions.length; index++) {
    const { transaction } = allTransactions[index]
    const { stock } = allTransactions[index]
    const { batch } = stock

    const transactionMonth = moment(transaction.createdAt).format('M')
    const transactionYear = moment(transaction.createdAt).format('YYYY')

    const assignStock = {
      transaction_id: transaction.id,
      material_id: transaction.material.id,
      material_name: transaction.material.name,
      material_is_vaccine: transaction.material.is_vaccine,
      no_batch: batch ? batch.code : '',
      ed: batch ? batch.expired_date : '',
      quantity: null,
    }

    if (batch && (new Date(transaction.createdAt) < new Date(`${year}-${month}-01`))) {
      const findBatchIndex = stockBatches.findIndex((el) =>
        el.material_id === transaction.material.id
        && el.no_batch === batch.code
      )

      assignStock.quantity = transaction.closing_qty
      findBatchIndex === -1 ? stockBatches.push(assignStock) : stockBatches[findBatchIndex] = assignStock
    }

    if (!batch && (new Date(transaction.createdAt) < new Date(`${year}-${month}-01`))) {
      const findMaterialIndex = stockNonBatch.findIndex((el) => el.material_id === transaction.material.id)

      assignStock.quantity = transaction.closing_qty
      findMaterialIndex === -1 ? stockNonBatch.push(assignStock) : stockNonBatch[findMaterialIndex] = assignStock
    }
    
    if (transactionMonth === month && transactionYear === year) {
      if (batch) {
        const findBatch = stockBatches.some((el) =>
          el.no_batch === batch.code &&
          el.material_id === transaction.material.id
        )

        if (!findBatch) {
          assignStock.quantity = transaction.opening_qty
          stockBatches.push(assignStock)
        }
      }

      if (!batch) {
        const findMaterial = stockNonBatch.some((el) => el.material_id === transaction.material.id)

        if (!findMaterial) {
          assignStock.quantity = transaction.opening_qty
          stockNonBatch.push(assignStock)
        }
      }

      const { customer } = transaction
      let customerName = ''
      let reasons = ''
      let other_reasons = ''

      if (customer) {
        customerName = customer.name
      }

      if (transaction.transaction_type_id === TRANSACTION_TYPE.RECEIPTS) {
        customerName = transaction.vendor?.name || ''
      }
      if (transaction.transaction_type_id === TRANSACTION_TYPE.STOCK_COUNT) {
        customerName = `${transaction.entity.name} (Hitung Stok)`
      }

      if (transaction.transaction_type_id === TRANSACTION_TYPE.DISCARDS) {
        customerName = `${transaction.entity.name} (Pembuangan)`
        reasons = transaction.transaction_reason.title
      }

      if (transaction.transaction_type_id === TRANSACTION_TYPE.ADD_STOCK) {
        customerName = `${transaction.entity.name} (Tambah Stok)`
        reasons = transaction.transaction_reason?.title
        other_reasons = transaction.other_reason
      }

      if (transaction.transaction_type_id === TRANSACTION_TYPE.REMOVE_STOCK) {
        customerName = `${transaction.entity.name} (Kurangi Stok)`
        reasons = transaction.transaction_reason?.title
        other_reasons = transaction.other_reason
      }

      if (transaction.transaction_type_id === TRANSACTION_TYPE.RETURN) {
        customerName = `${transaction.entity.name} (Pengembalian Faskes)`
      }

      const stockStatus = getStockStatusLabel(stock.status)

      transactionRowData.push({
        material_id: transaction.material.id,
        material_name: transaction.material.name,
        material_is_vaccine: transaction.material.is_vaccine,
        institution_name: customerName,
        date: transaction.createdAt,
        total: '',
        dosis: transaction.change_qty,
        opening_qty: transaction.opening_qty,
        vvm: stockStatus,
        no_batch: batch ? batch.code : '',
        ed: batch ? batch.expired_date : '',
        type_id: transaction.transaction_type_id,
        chg_type: transaction.transaction_type.chg_type,
        reasons,
        other_reasons,
      })
    }
  }

  const transactionByDate = transactionRowData.sort((a, b) => new Date(a.date) - new Date(b.date))

  const stockBatchByDate = stockBatches.sort((a, b) => new Date(a.date) - new Date(b.date))

  const stockNonBatchByDate = stockNonBatch.sort((a, b) => new Date(a.date) - new Date(b.date))

  const transactionByMaterials = groupByKey(transactionByDate, 'material_id')
  const stockBatchByMaterials = groupByKey(stockBatchByDate, 'material_id')
  const stockNonBatchByMaterials = groupByKey(stockNonBatchByDate, 'material_id')

  for (const key in stockBatchByMaterials) {
    data.push({
      material_name: stockBatchByMaterials[key][0].material_name,
      is_vaccine: stockBatchByMaterials[key][0].material_is_vaccine === 1 ? 'Vaksin' : 'Non Vaksin',
      transactions: transactionRowData.length > 0 && transactionByMaterials[key] ? transactionByMaterials[key] : [],
      stock_batches: stockBatchByMaterials[key],
      month: month - 1,
      year,
    })
  }

  if (stockNonBatch.length > 0) {
    for (const key in stockNonBatchByMaterials) {
      data.push({
        material_name: stockNonBatchByMaterials[key][0].material_name,
        is_vaccine: stockNonBatchByMaterials[key][0].material_is_vaccine === 1 ? 'Vaksin' : 'Non Vaksin',
        transactions: transactionRowData.length > 0 && transactionByMaterials[key] ? transactionByMaterials[key] : [],
        stock_batches: stockNonBatchByMaterials[key],
        month: month - 1,
        year,
      })
    }
  }

  return data
}

export async function exportExcelByEntity(req, res, next) {
  try {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { entity_id } = req.params
    const { month = currentMonth, year = currentYear } = req.query

    const query = { entity_id, month, year }

    const data = await getExportExcelByEntityData(query, res)

    const entity = await Entity.findByPk(entity_id)

    const workbook = transactionLogBook(data)

    const currentDate = new Date()
    const getMonth = moment(`${year}-${month}-1`).format('MMMM')

    const filename = `BUKU STOK ${entity.name} ${getMonth} ${year} ${currentDate}`

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
    next(err)
  }
}

export async function exportExcelAllEntity(req, res, next) {
  try {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { month = currentMonth, year = currentYear, entity_id } = req.query
    const condition = [{ is_vendor: 1 }]

    if (entity_id) {
      let entityIds = await models.CustomerVendor.findAll({
        where: [{ vendor_id: entity_id }],
      })
      entityIds = entityIds.map((el) => el.customer_id)
      condition.push({
        id: {
          [Op.in]: entityIds,
        },
      })
    } else {
      condition.push({
        [Op.or]: [
          { type: ENTITY_TYPE.PROVINSI },
          { type: ENTITY_TYPE.KOTA },
        ],
      })
    }
    const entities = await Entity.findAll({
      where: condition,
    })

    const zip = new JSZip()

    for (let index = 0; index < entities.length; index++) {
      const entity = entities[index]

      const query = { entity_id: entity.id, month, year }

      const data = await getExportExcelByEntityData(query, res)

      const workbook = transactionLogBook(data)

      const currentDate = new Date()

      const filename = `Buku Stok ${entity.name} ${currentDate}.xlsx`

      const workbookBuffer = await workbook.xlsx.writeBuffer()

      zip.file(filename, workbookBuffer)
    }

    let zipBuffer = null
    if (JSZip.support.uint8array) {
      zipBuffer = await zip.generateAsync({ type: 'uint8array' })
    } else {
      zipBuffer = await zip.generateAsync({ type: 'string' })
    }

    const readStream = new stream.PassThrough()
    readStream.end(zipBuffer)

    res.writeHead(200, {
      'Content-Length': zipBuffer.length,
      'Content-Disposition': 'attachment; filename="log_book_all_entity.zip"',
      'Access-Control-Expose-Headers': 'Filename',
      Filename: 'log_book_all_entity.zip',
    })

    return readStream.pipe(res)
  } catch (err) {
    next(err)
  }
}

export async function exportExcel(req, res, next) {
  try {
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
      ...customOptions,
      duplicating: false,
      subQuery: false,
    }

    if (include && typeof include === 'object') options.include = include

    const transactions = await Transaction.findAll(options)

    const data = []
    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index]

      const { material_tags } = transaction.material
      const { transaction_reason } = transaction

      let materialTagsConcat = ''
      material_tags.forEach((tags) => {
        materialTagsConcat += `${tags.title}; `
      })

      const user = transaction.user_created
      let transactionReasonLabel = ''
      if (transaction_reason) {
        transactionReasonLabel = transaction_reason.is_other ? `${transaction_reason.title}, ${transaction.other_reason}` : transaction_reason.title
      }

      data.push({
        entity_id: transaction.entity_id,
        entity_name: transaction.entity_name,
        material_id: transaction.material_id,
        material_name: transaction.material_name,
        material_tags: materialTagsConcat,
        customer_name: transaction.customer?.name || '',
        vendor_name: transaction.vendor?.name || '',
        order_id: transaction.order_id || '',
        order_type: transaction.order?.type || '',
        opening_stock: transaction.opening_qty,
        quantity: transaction.change_qty,
        closing_stock: transaction.closing_qty,
        transaction_type: transaction.transaction_type?.title || '',
        transaction_reason: transactionReasonLabel,
        stock_in_hand: transaction.stock?.available || '',
        min: transaction.stock?.material_entity?.min || '',
        max: transaction.stock?.material_entity?.max || '',
        allocated_stock: transaction.stock?.allocated || '',
        batch_code: transaction.stock?.batch?.code || '',
        stock_in_batch: transaction.stock?.qty || '',
        batch_expiry: transaction.stock?.batch?.expired_date || '',
        batch_manufacturer: transaction.stock?.batch?.manufacture_name,
        created_by: user?.firstname ? `${user.firstname} ${user.lastname ? user.lastname : ''}` : '',
        created_at: transaction.createdAt,
        dose_1: transaction.injection?.dose_1,
        dose_2: transaction.injection?.dose_2,
        dose_booster: transaction.injection?.dose_booster,
        dose_routine: transaction.injection?.dose_routine,
      })
    }

    const columns = [
      { key: 'entity_id', title: 'Entity ID' },
      { key: 'entity_name', title: 'Entity Name' },
      { key: 'material_id', title: 'Material ID' },
      { key: 'material_name', title: 'Material Name' },
      { key: 'material_tags', title: 'Material Tags' },
      { key: 'opening_stock', title: 'Opening Stock' },
      { key: 'quantity', title: 'Quantity' },
      { key: 'closing_stock', title: 'Closing Stock' },
      { key: 'transaction_type', title: 'Transaction Type' },
      { key: 'transaction_reason', title: 'Transaction Reason' },
      { key: 'customer_name', title: 'Customer Name' },
      { key: 'vendor_name', title: 'Vendor Name' },
      { key: 'order_id', title: 'Order ID' },
      { key: 'order_type', title: 'Order Type' },
      { key: 'stock_in_hand', title: 'Stock on Hands' },
      { key: 'min', title: 'Min.' },
      { key: 'max', title: 'Max.' },
      { key: 'allocated_stock', title: 'Allocated Stock' },
      { key: 'batch_code', title: 'Batch Code' },
      { key: 'stock_in_batch', title: 'Stock in Batch' },
      { key: 'batch_expiry', title: 'Batch Expiry' },
      { key: 'batch_manufacturer', title: 'Batch Manufacture' },
      { key: 'created_by', title: 'Created by Full Name' },
      { key: 'created_at', title: 'Created at' },
      { key: 'dose_1', title: 'Dose 1' },
      { key: 'dose_2', title: 'Dose 2' },
      { key: 'dose_booster', title: 'Dose Booster' },
      { key: 'dose_routine', title: 'Dose Routine' },
    ]

    const workbook = commonLists(data, columns)

    const filename = `Transactions ${Date()}`

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
    next(err)
  }
}
