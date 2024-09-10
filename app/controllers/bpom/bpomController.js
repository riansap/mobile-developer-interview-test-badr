/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-case-declarations */
import https from 'https'
import axios from 'axios'
import moment from 'moment-timezone'

import { Op } from 'sequelize'

import {
  ENTITY_TYPE, ORDER_STATUS, ORDER_TYPE, TRANSACTION_TYPE,
} from '../../helpers/constants'
import {
  getBPOMHeader, formatRegencyID, formatProvinceID, getKelompokSarana,
} from '../../helpers/integrations/bpomIntegrationHelper'

import models from '../../models'

const { BPOM_URL } = process.env
const distributeUrlBPOM = `${BPOM_URL}/integration/distribute`
const receiveUrlBPOM = `${BPOM_URL}/integration/receive`
const fasyankesUrlBPOM = `${BPOM_URL}/integration/fasyankes`
const saranaUrlBPOM = `${BPOM_URL}/integration/sendSarana`

function formatTglPemasukan(date) {
  return moment(date).tz('Asia/Jakarta').format('YYYY-MM-DD')
}

function formatReceiveFromTrans(transaction, bpomType) {
  const {
    order_id, createdAt, material,
    change_qty, stock, customer, vendor,
  } = transaction
  const expiredDate = stock?.batch?.expired_date || ''
  return {
    jenis: bpomType,
    tgl_pemasukan: formatTglPemasukan(createdAt),
    kode: material.bpom_code,
    jumlah: change_qty,
    batch: stock?.batch?.code || '',
    tgl_expired: formatTglPemasukan(expiredDate),
    nomor_faktur: order_id,
    sumber: vendor ? `SM-${vendor.code}` : null,
    pelapor: customer ? `SM-${customer.code}` : null,
    keterangan: '',
    kerusakan_produk: '',
  }
}

function formatDistributeFromTrans(transaction, bpomType) {
  const {
    order_id, createdAt, material,
    change_qty, stock, customer, vendor,
    transaction_reason,
  } = transaction
  const expiredDate = stock?.batch?.expired_date || ''
  return {
    jenis: bpomType,
    tgl_distribusi: formatTglPemasukan(createdAt),
    kode: material.bpom_code,
    jumlah: change_qty,
    batch: stock?.batch?.code || '',
    tgl_expired: formatTglPemasukan(expiredDate),
    nomor_faktur: order_id,
    pelapor: vendor ? `SM-${vendor.code}` : null,
    tujuan: customer ? `SM-${customer.code}` : null,
    keterangan: {
      kerusakan_produk: transaction_reason?.title || '',
    },
  }
}

function formatFasyankesFromTrans(transaction, bpomType) {
  const {
    createdAt, material, transaction_reason,
    change_qty, stock, entity,
  } = transaction
  const expiredDate = stock?.batch?.expired_date || ''
  return {
    jenis: bpomType,
    tgl_distribusi: formatTglPemasukan(createdAt),
    kode: material.bpom_code,
    jumlah: change_qty,
    batch: stock?.batch?.code || '',
    tgl_expired: formatTglPemasukan(expiredDate),
    pelapor: `SM-${entity.code}`,
    peruntukan: null,
    keterangan: {
      kerusakan_produk: transaction_reason?.title || '',
    },
  }
}

function formatSaranaBPOM(entity) {
  const kelSarana = getKelompokSarana(entity.type)
  const cityFormatted = kelSarana === '1' ? formatRegencyID(entity.regency_id) : '31.01'
  const provinceFormatted = kelSarana === '1' ? formatProvinceID(entity.province_id) : '31'

  const { user } = entity
  return {
    key_sarana: entity.bpom_key,
    kode_sarana: `SM-${entity.code}`,
    kelompok_sarana: kelSarana,
    name: entity.name,
    alamat: entity.address,
    city: cityFormatted,
    province: provinceFormatted,
    kode_pos: entity.postal_code,
    pic: user ? user.firstname + user.lastname : '',
    email: user ? user.email : '',
    no_tlp: user ? user.mobile_phone : '',
    no_izin: '-',
    tgl_izin: '-',
    nib: '',
    npwp: '',
    lat: '',
    long: '',
    no_sertifikat: '-',
    tgl_sertifikat: '-',
    tgl_surat_pernyataan: '-',
  }
}

async function sendSarana(entity) {
  const postSarana = {
    method: 'POST',
    headers: getBPOMHeader(),
    url: saranaUrlBPOM,
  }
  try {
    await axios({
      ...postSarana,
      data: formatSaranaBPOM(entity),
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    })
  } catch (err) {
    if (err.response && err.response.data.kode !== 3) console.log('---ERROR SARANA---', err)
  }
}

async function sendToBPOM({
  url, payload, vendor = {},
  entity = {}, customer = {},
  transaction_id = null, transaction_type_id = null,
}) {
  // create sarana if not exists
  if (url === fasyankesUrlBPOM) {
    await sendSarana(entity)
  } else {
    await sendSarana(vendor)
    await sendSarana(customer)
  }
  const bpomLog = {
    url,
    payload: JSON.stringify(payload),
    order_id: payload.order_id,
    customer_id: customer?.id || null,
    vendor_id: vendor?.id || null,
    entity_id: entity?.id || null,
    transaction_id,
    transaction_type_id,
  }
  try {
    const response = await axios({
      method: 'POST',
      url,
      headers: getBPOMHeader(),
      data: payload,
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    })
    await models.BpomLog.create({
      ...bpomLog,
      response: JSON.stringify(response.data),
      response_code: response.status,
    })
  } catch (error) {
    console.error(error)
    console.log('---BPOM ERROR---')
    console.log(url)
    console.log(payload)
    console.log('---END ERROR---')
    await models.BpomLog.create({
      ...bpomLog,
      response: JSON.stringify(error?.response?.data || error),
      response_code: error.response?.status || null,
    })
    // throw Error(error)
  }
}

// format transaction to generate data
async function sendTransOrderToBPOM(transaction) {
  const { order, vendor, customer } = transaction
  let bpomType = null
  const bpomLog = {
    transaction_id: transaction.id,
    transaction_type_id: transaction.transaction_type_id,
  }
  switch (transaction.transaction_type_id) {
  case TRANSACTION_TYPE.RECEIPTS:
    let url = receiveUrlBPOM
    let payload = null
    if (order.type === ORDER_TYPE.RETURN) {
      bpomType = 6
      payload = formatReceiveFromTrans(transaction, bpomType)
    } else if (order.type === ORDER_TYPE.DROPPING) {
      if (order.status === ORDER_STATUS.CANCELED) {
        bpomType = 3
        payload = formatDistributeFromTrans({
          ...transaction,
          change_qty: transaction.change_qty * -1,
        }, bpomType)
        url = distributeUrlBPOM
      } else {
        bpomType = 2
        payload = formatReceiveFromTrans(transaction, bpomType)
      }
    }
    if (url && payload) {
      await sendToBPOM({
        url,
        payload,
        vendor,
        customer,
        ...bpomLog,
      })
    }
    break
  case TRANSACTION_TYPE.ISSUES:
    let payloadIssue = null
    if (order.type === ORDER_TYPE.RETURN) {
      bpomType = 5
      payloadIssue = formatDistributeFromTrans(transaction, bpomType)
    } else if (order.type === ORDER_TYPE.DROPPING) {
      if (order.status === ORDER_STATUS.CANCELED) {
        bpomType = 3
        payloadIssue = formatDistributeFromTrans({
          ...transaction,
          change_qty: transaction.change_qty * -1,
        }, bpomType)
      } else {
        bpomType = 1
        payloadIssue = formatDistributeFromTrans(transaction, bpomType)
      }
    }
    if (payloadIssue) {
      await sendToBPOM({
        url: distributeUrlBPOM,
        payload: payloadIssue,
        vendor,
        customer,
        ...bpomLog,
      })
    }
    break
  default:
    break
  }
}

async function sendTransToBPOM(transaction) {
  const { entity, customer } = transaction
  let bpomType = null
  const bpomLog = {
    transaction_id: transaction.id,
    transaction_type_id: transaction.transaction_type_id,
  }

  switch (transaction.transaction_type_id) {
  case TRANSACTION_TYPE.RETURN:
    bpomType = 2
    transaction.vendor = customer
    transaction.customer = entity
    await sendToBPOM({
      url: receiveUrlBPOM,
      payload: formatReceiveFromTrans(transaction, bpomType),
      vendor: customer,
      customer: entity,
      ...bpomLog,
    })
    break
  case TRANSACTION_TYPE.DISCARDS:
    bpomType = 6
    if (entity.type === ENTITY_TYPE.FASKES) {
      await sendToBPOM({
        url: fasyankesUrlBPOM,
        payload: formatFasyankesFromTrans(transaction, bpomType),
        entity,
        ...bpomLog,
      })
    } else {
      transaction.vendor = entity
      transaction.customer = entity
      await sendToBPOM({
        url: distributeUrlBPOM,
        payload: formatDistributeFromTrans(transaction, bpomType),
        vendor: entity,
        customer: entity,
        ...bpomLog,
      })
    }
    break
  case TRANSACTION_TYPE.ISSUES:
    bpomType = 1
    if (entity.type === ENTITY_TYPE.FASKES) {
      await sendToBPOM({
        url: fasyankesUrlBPOM,
        payload: formatFasyankesFromTrans(transaction, bpomType),
        entity,
        ...bpomLog,
      })
    } else {
      transaction.vendor = entity
      await sendToBPOM({
        url: distributeUrlBPOM,
        payload: formatDistributeFromTrans(transaction, bpomType),
        vendor: entity,
        customer,
        ...bpomLog,
      })
    }
    break
  default:
    break
  }
}

async function sendStartEndStock(stock) {
  let { firstTrx, lastTrx } = stock
  // send stok awal
  await sendToBPOM({
    url: receiveUrlBPOM,
    payload: formatReceiveFromTrans({
      ...firstTrx,
      change_qty: firstTrx.opening_qty,
      order_id: null,
      vendor: firstTrx.entity,
      customer: firstTrx.entity,
    }, 1),
    vendor: firstTrx.entity,
    customer: firstTrx.entity,
    transaction_id: firstTrx.id,
  })
  // send stok akhir
  let closingQty = 0
  if (!lastTrx) lastTrx = firstTrx
  if (lastTrx.transaction_type_id === TRANSACTION_TYPE.DISCARDS
    || lastTrx.transaction_type_id === TRANSACTION_TYPE.REMOVE_STOCK
    || lastTrx.transaction_type_id === TRANSACTION_TYPE.ISSUES
  ) {
    closingQty = lastTrx.opening_qty - lastTrx.change_qty
  } else {
    closingQty = lastTrx.opening_qty + lastTrx.change_qty
  }
  console.log('----- startStock, endStock ------', firstTrx.opening_qty, closingQty)
  await sendToBPOM({
    url: receiveUrlBPOM,
    payload: formatReceiveFromTrans({
      ...lastTrx,
      change_qty: closingQty,
      order_id: null,
      vendor: lastTrx.entity,
      customer: lastTrx.entity,
    }, 3),
    vendor: lastTrx.entity,
    customer: lastTrx.entity,
    transaction_id: lastTrx.id,
  })
}

// get transaction per start_date & end_date
export async function sendTransactionBPOM(startDate, endDate) {
  if (!startDate || !endDate) throw Error({ message: 'startDate & endDate must exists' })
  const condition = [
    { createdAt: { [Op.gte]: startDate } },
    { createdAt: { [Op.lte]: endDate } },
  ]
  const relations = [
    { association: 'material', required: true, where: { bpom_code: { [Op.not]: null } } },
    {
      association: 'stock',
      include: { association: 'batch' },
    },
    { association: 'customer' },
    { association: 'vendor' },
    { association: 'entity', required: true },
  ]

  const stocks = []
  const transactionsWithOrder = await models.Transaction.findAll({
    where: [
      { order_id: { [Op.not]: null } },
      ...condition,
    ],
    include: [
      ...relations,
      { association: 'order', required: true, where: { type: { [Op.in]: [ORDER_TYPE.DROPPING, ORDER_TYPE.RETURN] } } },
    ],
  })
  // console.log(transactionsWithOrder.length)
  for (const transaction1 of transactionsWithOrder) {
    // map per type
    const stockIdx = stocks.findIndex((el) => el.stock_id === transaction1.stock_id)
    if (stockIdx < 0) {
      stocks.push({
        stock_id: transaction1.stock_id,
        firstTrx: transaction1,
        lastTrx: null,
      })
    } else {
      stocks[stockIdx].lastTrx = transaction1
    }
    await sendTransOrderToBPOM(transaction1)
  }

  const transactionWithoutOrder = await models.Transaction.findAll({
    where: [
      { order_id: null },
      ...condition,
    ],
    include: [
      ...relations,
      { association: 'transaction_reason' },
    ],
  })
  // console.log(transactionWithoutOrder.length)
  for (const transaction2 of transactionWithoutOrder) {
    const stockIdx = stocks.findIndex((el) => el.stock_id === transaction2.stock_id)
    if (stockIdx < 0) {
      stocks.push({
        stock_id: transaction2.stock_id,
        firstTrx: transaction2,
        lastTrx: null,
      })
    } else {
      if (stocks[stockIdx].firstTrx.id > transaction2.id) {
        // push startStock
        stocks[stockIdx].firstTrx = transaction2
      }
      if (stocks[stockIdx].lastTrx && transaction2.id < stocks[stockIdx].lastTrx.id) {
        // do nothing transaction is bigger
      } else {
        stocks[stockIdx].lastTrx = transaction2
      }
    }
    await sendTransToBPOM(transaction2)
  }

  // get stock before startDate
  for (const stock of stocks) {
    console.log('-----------stock awal & akhir------', stock)
    await sendStartEndStock(stock)
  }
}

export async function cronBPOMHourly(startHour, endHour) {
  const startDate = `${moment().format('YYYY-MM-DD')} ${startHour}:00:00`
  const endDate = `${moment().format('YYYY-MM-DD')} ${endHour}:59:59`
  console.log('-------start transaction to bpom--------', startDate, endDate)
  await sendTransactionBPOM(startDate, endDate)
}

export async function testIntegrationTransactionBPOM(req, res, next) {
  try {
    const { startDate, endDate } = req.body
    if (!startDate || !endDate) return res.status(400).json({ message: 'startDate & endDate harus diisi' })
    await sendTransactionBPOM(startDate, endDate)
    return res.status(200).json({ message: 'BPOM transaction executed' })
  } catch (err) {
    return next(err)
  }
}
