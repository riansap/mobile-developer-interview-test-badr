import stream from 'stream'
import moment from 'moment-timezone'
import Excel from 'exceljs'

import { Op } from 'sequelize'
import models from '../../../models'

import { commonLists } from '../../../helpers/xls/excelTemplate'
import { getOrderStatusLabel, TRANSACTION_TYPE, getStockStatusLabel, TRANSACTION_CHANGE_TYPE, ENTITY_TYPE } from '../../../helpers/constants'
import { doDecrypt, formatWIB, groupByKey } from '../../../helpers/common'
import JSZip from 'jszip'
import errorResponse from '../../../helpers/errorResponse'

export async function exportExcel(req, res, next) {
  try {
    const {
      condition = {},
      attributes,
      order,
      include,
      customOptions,
    } = req

    const {
      logistik
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

    const transactions = await models.TransactionLast3Month.findAll(options)

    const data = []
    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index]

      const { transaction_reason, patient, vaccine_sequence, transaction_patients } = transaction

      let transactionPatients = transaction_patients.map(tp=>{
        return tp?.patient ? doDecrypt(tp?.patient?.nik) + ` (${req.__('rabies_vaccine.'+ tp.vaccine_sequence)})` : ''
      })

      let patientIds = ''

      if(transactionPatients.length>0) patientIds = transactionPatients.join(', ')
      else if(patient) patientIds = doDecrypt(patient?.nik) + ' (' + req.__(`rabies_vaccine.${vaccine_sequence}`) + ')'

      const user = transaction.user_created
      let transactionReasonLabel = ''
      if (transaction_reason) {
        transactionReasonLabel = transaction_reason.is_other ? `${transaction_reason.title}, ${transaction.other_reason}` : transaction_reason.title
      }

      const { transaction_purchase } = transaction
      let transactionPurchase = {}
      if (transaction_purchase) {
        transactionPurchase = {
          source_material: transaction_purchase?.source_material?.name || '',
          year: transaction_purchase?.year || '',
          price: transaction_purchase?.price || '',
          pieces_purchase: transaction_purchase?.pieces_purchase?.name || ''
        }
      }

      data.push({
        entity_id: transaction.entity_id,
        entity_name: transaction.entity_name,
        material_id: transaction?.master_material?.id || '',
        material_name: transaction?.master_material?.name || '',
        activity_name: transaction?.activity?.name || '',
        customer_name: transaction?.customer?.name || '',
        vendor_name: transaction?.vendor?.name || '',
        order_id: transaction.order_id || '',
        order_status: transaction.order ? getOrderStatusLabel(transaction.order.status) : '',
        order_type: transaction.order?.type || '',
        opening_stock: transaction.opening_qty,
        quantity: transaction.change_qty,
        closing_stock: transaction.closing_qty,
        transaction_type: transaction?.transaction_type?.title || '',
        transaction_reason: transactionReasonLabel,
        stock_in_hand: transaction?.stock?.available || '',
        min: transaction?.stock?.material_entity?.min || '',
        max: transaction?.stock?.material_entity?.max || '',
        allocated_stock: transaction?.stock?.allocated || '',
        batch_code: transaction?.stock?.batch?.code || '',
        stock_in_batch: transaction?.stock?.qty || '',
        stock_activity_name: transaction?.stock?.activity_name || '',
        batch_expiry: transaction?.stock?.batch?.expired_date || '',
        batch_manufacturer: transaction?.stock?.batch?.manufacture_name || '',
        patient_id : patientIds ,
        actual_transaction_date : formatWIB(transaction.actual_transaction_date, 'YYYY-MM-DD HH:mm'),
        created_by: user?.firstname ? `${user.firstname} ${user.lastname ? user.lastname : ''}` : '',
        created_at: formatWIB(transaction.createdAt, 'YYYY-MM-DD HH:mm'),
        dose_1: transaction?.injection?.dose_1 || '',
        dose_2: transaction?.injection?.dose_2 || '',
        dose_booster: transaction?.injection?.dose_booster || '',
        dose_routine: transaction?.injection?.dose_routine || '',
        ...transactionPurchase
      })
    }

    let columns = [
      { key: 'entity_id', title: 'Entity ID' },
      { key: 'entity_name', title: 'Entity Name' },
      { key: 'material_id', title: 'Material ID' },
      { key: 'material_name', title: 'Material Name' },
      { key: 'activity_name', title: 'Activity Name' },
      { key: 'opening_stock', title: 'Opening Stock' },
      { key: 'quantity', title: 'Quantity' },
      { key: 'closing_stock', title: 'Closing Stock' },
      { key: 'transaction_type', title: 'Transaction Type' },
      { key: 'transaction_reason', title: 'Transaction Reason' },
      { key: 'customer_name', title: 'Customer Name' },
      { key: 'vendor_name', title: 'Vendor Name' },
      { key: 'order_id', title: 'Order ID' },
      { key: 'order_status', title: 'Order Status' },
      { key: 'order_type', title: 'Order Type' },
      { key: 'stock_in_hand', title: 'Stock on Hands' },
      { key: 'stock_activity_name', title: 'Taken from activities' },
      { key: 'min', title: 'Min.' },
      { key: 'max', title: 'Max.' },
      { key: 'allocated_stock', title: 'Allocated Stock' },
      { key: 'batch_code', title: 'Batch Code' },
      { key: 'stock_in_batch', title: 'Stock in Batch' },
      { key: 'batch_expiry', title: 'Batch Expiry' },
      { key: 'batch_manufacturer', title: 'Batch Manufacture' },
      { key: 'patient_id', title : 'Patient ID'},
      { key: 'actual_transaction_date', title : 'Actual Transaction Date'},
      { key: 'created_by', title: 'Created by Full Name' },
      { key: 'created_at', title: 'Created at' },
    ]

    if (!logistik) {
      columns.push({ key: 'dose_1', title: 'Dose 1' })
      columns.push({ key: 'dose_2', title: 'Dose 2' })
      columns.push({ key: 'dose_booster', title: 'Dose Booster' })
      columns.push({ key: 'dose_routine', title: 'Dose Routine' })
    } else {
      columns.push({ key: 'source_material', title: 'Source Material' })
      columns.push({ key: 'year', title: 'Year of Source' })
      columns.push({ key: 'price', title: 'Price' })
      columns.push({ key: 'pieces_purchase', title: 'Piece per Price' })
    }

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

export const transactionLogBook = (data) => {
  const workbook = new Excel.Workbook()

  workbook.creator = 'SMILE'
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 1,
      visibility: 'visible',
    },
  ]

  if (data.length < 1) {
    workbook.addWorksheet('', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Report Transaction', firstFooter: 'Report Transaction' },
    })
  }

  data.forEach((data, idx) => {
    let material_name = data.material_name.replace(/[/?:*\]\[\\]/gi, "")
    const worksheet = workbook.addWorksheet(`${idx}-${material_name}`, {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Report Transaction', firstFooter: 'Report Transaction' },
    })

    const { transactions } = data

    worksheet.columns = [
      { key: 'receive_institution_name' },
      { key: 'receive_date' },
      { key: 'receive_total' },
      { key: 'receive_dosis' },
      //{ key: 'receive_vvm' },
      { key: 'receive_no_batch' },
      { key: 'receive_ed' },
      { key: 'receive_activity' },
      { key: 'receive_stock_activity' },
      { key: 'issue_institution_name' },
      { key: 'issue_date' },
      { key: 'issue_total' },
      { key: 'issue_dosis' },
      //{ key: 'issue_vvm' },
      { key: 'issue_no_batch' },
      { key: 'issue_ed' },
      { key: 'issue_activity' },
      { key: 'issue_stock_activity' },
      { key: 'akumulatif' },
      { key: 'keterangan' },
      { key: 'reasons' },
    ]

    worksheet.getColumn(1).values = ['PENCATATAN STOK VAKSIN/LOGISTIK', '', '', 'Penerimaan', 'Nama Institusi']
    worksheet.getColumn(2).values = ['', '', '', '', 'Tanggal']
    worksheet.getColumn(3).values = ['', '', '', '', 'Jumlah']
    worksheet.getColumn(4).values = ['', '', '', '', 'Dosis/Buah/Pasang']
    worksheet.getColumn(5).values = ['', 'NAMA VAKSIN/LOGISTIK:', '', '', 'No. Batch']
    worksheet.getColumn(6).values = ['', '', '', '', 'ED']
    worksheet.getColumn(7).values = ['', '', '', '', 'Kegiatan']
    worksheet.getColumn(8).values = ['', data.material_name, '', '', 'diambil dari Kegiatan']
    worksheet.getColumn(9).values = ['', data.is_vaccine, '', 'Pengeluaran', 'Nama Institusi']
    worksheet.getColumn(10).values = ['', '', '', '', 'Tanggal']
    worksheet.getColumn(11).values = ['', '', '', '', 'Jumlah']
    worksheet.getColumn(12).values = ['', '', '', '', 'Dosis/Buah/Pasang']
    worksheet.getColumn(13).values = ['', '', '', '', 'No. Batch']
    worksheet.getColumn(14).values = ['', '', '', '', 'ED']
    worksheet.getColumn(15).values = ['', '', '', '', 'Kegiatan']
    worksheet.getColumn(16).values = ['', '', '', '', 'diambil dari Kegiatan']
    worksheet.getColumn(17).values = ['', '', '', '', 'Sisa Akumulatif']
    worksheet.getColumn(18).values = ['', '', '', '', 'Keterangan']
    worksheet.getColumn(19).values = ['', '', '', '', 'Alasan']
    worksheet.getColumn(20).values = ['', '', '', '', '']
    worksheet.getColumn(21).values = ['', '', '', '', '']

    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }

      const titleCells = ['A1:R1', 'A4:H4', 'I4:R4', 'E2:G2']

      titleCells.forEach((cell) => {
        worksheet.mergeCells(cell)
        worksheet.getCell(cell).alignment = alignmentCenter
      })
    }

    const { stock_batches } = data

    let akumulatif = 0
    let keterangan = ''
    if (stock_batches.length > 0) {
      for (const batch of stock_batches) {
        akumulatif += batch.quantity
        worksheet.addRow({
          receive_institution_name: `Sisa Stock ${moment().month(data.month).year(data.year).add(-1, 'months')
            .format('MMMM yyyy')}`,
          receive_date: '',
          receive_total: '',
          receive_dosis: batch.quantity,
          receive_vvm: '',
          receive_no_batch: batch.no_batch,
          receive_ed: batch.ed,
          receive_activity: '',
          receive_stock_activity: batch.stock_activity,
          akumulatif,
          reasons: '',
        })
      }
    }

    transactions.forEach((transaction, index) => {
      let addRow = {}
      const lastAkumulatif = akumulatif

      if (transaction.chg_type === TRANSACTION_CHANGE_TYPE.ADD) {
        // transaction.type_id === TRANSACTION_TYPE.RECEIPTS
        akumulatif += transaction.dosis
      } else {
        // TRANSACTION_CHANGE_TYPE.REMOVE
        akumulatif -= transaction.dosis
      }

      if (transaction.chg_type === TRANSACTION_CHANGE_TYPE.ADD) {
        // transaction.type_id === TRANSACTION_TYPE.RECEIPTS
        addRow = {
          receive_institution_name: transaction.institution_name,
          receive_date: transaction.date,
          receive_total: transaction.total,
          receive_dosis: transaction.dosis,
          receive_vvm: transaction.vvm,
          receive_no_batch: transaction.no_batch,
          receive_ed: transaction.ed,
          receive_activity: transaction.activity,
          receive_stock_activity: transaction.stock_activity,
          akumulatif,
          keterangan: transaction.other_reasons,
          reasons: transaction.reasons,
        }
      } else {
        if (transaction.chg_type === TRANSACTION_CHANGE_TYPE.RESTOCK) {
          // transaction.type_id === TRANSACTION_TYPE.STOCK_COUNT
          keterangan = transaction.dosis - lastAkumulatif
          akumulatif = (lastAkumulatif - transaction.opening_qty) + transaction.dosis
        }

        addRow = {
          issue_institution_name: transaction.institution_name,
          issue_date: transaction.date,
          issue_total: transaction.total,
          issue_dosis: transaction.dosis,
          issue_vvm: transaction.vvm,
          issue_no_batch: transaction.no_batch,
          issue_ed: transaction.ed,
          issue_activity: transaction.activity,
          issue_stock_activity: transaction.stock_activity,
          akumulatif,
          reasons: transaction.reasons,
        }
      }

      worksheet.addRow({
        ...addRow,
      })
    })

    _adjustCell()
  })

  return workbook
}

async function getExportExcelByEntityData(query, res) {
  const { entity_id, month, year } = query

  const data = []

  const materialEntities = await models.EntityMasterMaterial.findAll({
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
              association: 'master_material',
              attributes: ['id', 'code', 'name', 'description', 'is_vaccine'],
              include: [
                {
                  association: 'material_type',
                  attributes: ['id', 'name']
                }
              ],
              required: true,
            },
            {
              association: 'transaction_type',
              attributes: models.TransactionType.getBasicAttribute(),
            },
            {
              association: 'transaction_reason',
              attributes: ['id', 'title', 'is_other'],
            },
            {
              association: 'entity',
              attributes: ['id', 'name', 'address'],
            },
            {
              association: 'activity',
              attributes: ['id', 'name'],
            },
          ],
          required: true,
        },
        {
          association: 'batch',
        },
        {
          association: 'activity',
          attributes: ['id', 'name'],
          required: true,
        }
      ],
    },
  })

  if (!materialEntities) return res.status(404).json(errorResponse('Data tidak ditemukan'))

  const allTransactions = []
  materialEntities.forEach((materialEntity) => {
    materialEntity.stocks.forEach((stock) => {
      stock.transactions.forEach((transaction) => {
        transaction.material = transaction.master_material
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

    const transactionMonth = moment(transaction.createdAt).format('MM')
    const transactionYear = moment(transaction.createdAt).format('YYYY')

    const assignStock = {
      transaction_id: transaction.id,
      material_id: transaction.master_material_id,
      material_name: transaction.material.name,
      material_is_vaccine: transaction.material.material_type ? transaction.material.material_type.name : 'Non Vaksin',
      no_batch: batch ? batch.code : '',
      ed: batch ? batch.expired_date : '',
      activity: '',
      stock_activity: stock.activity?.name,
      quantity: null,
    }

    if (batch && (new Date(transaction.createdAt) < new Date(`${year}-${month}-01`))) {
      const findBatchIndex = stockBatches.findIndex((el) =>
        el.material_id === transaction.master_material_id
        && el.no_batch === batch.code && el.stock_activity === stock.activity.name
      )
      assignStock.quantity = transaction.closing_qty
      findBatchIndex === -1 ? stockBatches.push(assignStock) : stockBatches[findBatchIndex] = assignStock
    }

    if (!batch && (new Date(transaction.createdAt) < new Date(`${year}-${month}-01`))) {
      const findMaterialIndex = stockNonBatch.findIndex((el) =>
        el.material_id === transaction.master_material_id &&
        el.stock_activity === stock.activity.name)

      assignStock.quantity = transaction.closing_qty
      findMaterialIndex === -1 ? stockNonBatch.push(assignStock) : stockNonBatch[findMaterialIndex] = assignStock
    }

    if (transactionMonth === month && transactionYear === year) {
      if (batch) {
        const findBatch = stockBatches.some((el) =>
          el.no_batch === batch.code &&
          el.material_id === transaction.master_material_id &&
          el.stock_activity === stock.activity.name
        )

        if (!findBatch) {
          assignStock.quantity = transaction.opening_qty
          stockBatches.push(assignStock)
        }
      }

      if (!batch) {
        const findMaterial = stockNonBatch.some((el) =>
          el.material_id === transaction.material.id &&
          el.stock_activity === stock.activity.name
        )

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
        reasons = transaction.transaction_reason?.title
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

      if (transaction.transaction_type_id === TRANSACTION_TYPE.CANCEL_DISCARD) {
        customerName = `${transaction.entity.name} (Pembatalan Pembuangan)`
        reasons = transaction.transaction_reason?.title
      }

      const stockStatus = getStockStatusLabel(stock.status)
      transactionRowData.push({
        material_id: transaction.material.id,
        material_name: transaction.material.name,
        material_is_vaccine: transaction.material.material_type ? transaction.material.material_type.name : 'Non Vaksin',
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
        activity: transaction.activity.name,
        stock_activity: stock.activity.name,
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
      is_vaccine: stockBatchByMaterials[key][0].material_is_vaccine,
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
        is_vaccine: stockNonBatchByMaterials[key][0].material_is_vaccine,
        transactions: transactionRowData.length > 0 && transactionByMaterials[key] ? transactionByMaterials[key] : [],
        stock_batches: stockNonBatchByMaterials[key],
        month: month - 1,
        year,
      })
    }
  }

  return data
}

export async function exportBukuStokByEntity(req, res, next) {
  // export buku stok
  try {
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const { entity_id } = req.params
    const { month = currentMonth, year = currentYear } = req.query

    const query = { entity_id, month, year }

    const data = await getExportExcelByEntityData(query, res)

    const entity = await models.Entity.findByPk(entity_id)

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
    const entities = await models.Entity.findAll({
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
      zipBuffer = await zip.generateAsync({ type: 'uint8array', streamFiles: true })
    } else {
      zipBuffer = await zip.generateAsync({ type: 'string' })
      //zipBuffer = await zip.generateAsync({ type: 'uint8array' })
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
