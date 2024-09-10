import axios from 'axios'
import { Op } from 'sequelize'
import moment from 'moment'
import _ from 'lodash'

import models from '../models'

import { publishWorker } from '../helpers/services/rabbitmqHelper'
import { ORDER_CANCEL_REASON, ORDER_STATUS } from '../helpers/constants'
import { getSmileHeader } from '../helpers/integrations/smileIntegrationHelper'

const { createLogger, format, transports } = require('winston')

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console()
  ],
})

const BIOFARMA_URL = process.env.BIOFARMA_URL
const BIOFARMA_USER = process.env.BIOFARMA_USER
const BIOFARMA_PASSWORD = process.env.BIOFARMA_PASSWORD
const BIOFARMA_STARTDATE = process.env.BIOFARMA_STARTDATE

const SMILE_URL = process.env.SMILE_URL

const BF_SMILE_USER = process.env.BF_SMILE_USER
const BF_SMILE_PASS = process.env.BF_SMILE_PASS

const ADMIN_USER = process.env.ADMIN_USER
const ADMIN_PASS = process.env.ADMIN_PASS

const orderCreated = []
async function createOrderSMILE(smileOrder) {
  const is_duplicate = orderCreated.includes(smileOrder.delivery_number)
  if (is_duplicate) {
    logger.info('================== check duplicate ===============', { is_duplicate, do: smileOrder.delivery_number })
  } else {
    const headers = await getSmileHeader(BF_SMILE_USER, BF_SMILE_PASS)

    const url = smileOrder.isV2 ? `${SMILE_URL}/v2/order/dropping` : `${SMILE_URL}/order/covid`
    const payload = {
      url,
      method: 'POST',
      headers: headers,
      data: smileOrder,
    }
    console.log('payload', payload, smileOrder.order_items, smileOrder.order_items?.batches)

    publishWorker('http-worker', payload)

    orderCreated.push(smileOrder.delivery_number)
    logger.info('================== create ===============', { url, do: smileOrder.delivery_number, batches: smileOrder.order_items })
  }
}

async function cancelOrderSMILE(biofarmaOrder, smileOrder) {
  logger.info('================== cancel ===============', { do: smileOrder.delivery_number, batch: smileOrder.no_batch })
  const headers = await getSmileHeader(ADMIN_USER, ADMIN_PASS)
  let smileV2 = false
  // have material
  for (let order_item of smileOrder.order_items) {
    if (order_item.material) {
      smileV2 = false
    } else {
      smileV2 = true
    }
  }
  const url = smileV2 ? `${SMILE_URL}/v2/order/${smileOrder.id}/cancel` : `${SMILE_URL}/order/${smileOrder.id}/cancel`
  const cancelOrder = await axios({
    method: 'PUT',
    url,
    headers: headers,
    data: {
      cancel_reason: ORDER_CANCEL_REASON.OTHERS,
      other_reason: 'Data Biofarma berubah',
    }
  })

  if (cancelOrder.status == 200) {
    // create new order
    await createOrderSMILE(biofarmaOrder)
  }
}

async function updateOrderSmile(smileOrder, biofarmaOrder) {
  // check status order smile
  if (smileOrder.status === ORDER_STATUS.FULFILLED) {
    smileOrder.biofarma_changed = true
    await smileOrder.save()
  } else {
    // cancel order
    await cancelOrderSMILE(biofarmaOrder, smileOrder)
  }
}

async function createOrder(lastOrder) {
  const smileOrder = await models.Order.findOne({
    where: [
      { delivery_number: lastOrder.delivery_number },
      { status: { [Op.not]: ORDER_STATUS.CANCELED } }
    ],
    without_comments: true
  })
  if (smileOrder) {
    if (!sameQtySMILE(smileOrder)) await updateOrderSmile(smileOrder, lastOrder)
  } else {
    await createOrderSMILE(lastOrder)
  }
}

function formatBatch(biofarmaOrder) {
  return {
    code: biofarmaOrder.no_batch,
    expired_date: moment(biofarmaOrder.expired_date).format('YYYY-MM-DD'),
    production_date: '',
    manufacture_name: 'Biofarma',
    qty: biofarmaOrder.jm_dosis
  }
}

let totalData = null
let lastData = 1
function isLastData() {
  return lastData === totalData
}

async function prepareOrderSmile(biofarmaOrder = {}) {
  if (lastNoDO === biofarmaOrder.no_do) {
    // check material
    const orderItemIdx = lastOrder.order_items.findIndex(item => { return item.material_code === biofarmaOrder.produk })
    if (orderItemIdx >= 0) {
      // find batch code
      const existBatch = lastOrder.order_items[orderItemIdx].batches.find(batch => { return batch.code === biofarmaOrder.no_batch })
      if (!existBatch) {
        // update to latest?
        lastOrder.order_items[orderItemIdx].batches.push(formatBatch(biofarmaOrder))
      }
    } else {
      lastOrder.order_items.push({
        material_code: biofarmaOrder.produk,
        batches: [formatBatch(biofarmaOrder)]
      })
    }
  } else {
    // order ready
    if (lastNoDO !== null && lastOrder && lastOrder.customer_code) {
      //   create new order
      await createOrder(lastOrder)
    }
    // create new entry no_do
    lastOrder = {
      vendor_code: '00',
      customer_code: biofarmaOrder.kode_area ? biofarmaOrder.kode_area.toString() : '',
      sales_ref: '',
      delivery_number: biofarmaOrder.no_do,
      service_type: biofarmaOrder.service_type,
      no_document: biofarmaOrder.no_document,
      released_date: biofarmaOrder.released_date,
      notes: biofarmaOrder.notes,
      order_items: [{
        material_code: biofarmaOrder.produk,
        batches: [formatBatch(biofarmaOrder)]
      }],
    }
  }
  if (isLastData()) {
    // create last order
    await createOrder(lastOrder)
  }
}

let ACTIVITY_BIOFARMA = 8

async function prepareOrderSmileV2(biofarmaOrder = {}) {
  const getActivitySix = await models.sequelize.query(`
    select mm.code from master_material_has_activities as mmha
    left join master_materials as mm on mm.id=mmha.master_material_id
    where activity_id = 6 and mm.is_vaccine in (0,1)
    and mm.code = $code
  `, {
    bind: { code: biofarmaOrder.produk },
    logging: false,
    type: models.sequelize.QueryTypes.SELECT
  })
  const getActivityThree = await models.sequelize.query(`
    SELECT 
      master_material_id,
      COUNT(*) jumlah
    FROM
      master_material_has_activities
    WHERE
      master_material_id in (
      SELECT mm.id FROM master_material_has_activities mmha
      LEFT JOIN master_materials mm ON mm.id=mmha.master_material_id
      WHERE activity_id = 3 AND mm.is_vaccine IN (0,1)
      AND mm.code = $code
      GROUP BY mm.id
    )
    GROUP BY master_material_id
  `, {
    bind: { code: biofarmaOrder.produk },
    logging: false,
    type: models.sequelize.QueryTypes.SELECT
  })
  console.log(getActivityThree)

  if (getActivitySix.length > 0) {
    ACTIVITY_BIOFARMA = 6
  } else if (getActivityThree[0]?.jumlah === 1) {
    ACTIVITY_BIOFARMA = 3
  } else {
    ACTIVITY_BIOFARMA = 1
  }

  if (lastNoDO === biofarmaOrder.no_do) {
    // check material
    const orderItemIdx = lastOrder.order_items.findIndex(item => { return item.material_code === biofarmaOrder.produk })
    if (orderItemIdx >= 0) {
      // find batch code
      const existBatch = lastOrder.order_items[orderItemIdx].batches.find(batch => { return batch.code === biofarmaOrder.no_batch })
      if (!existBatch) {
        // update to latest?
        lastOrder.order_items[orderItemIdx].batches.push(formatBatchV2(biofarmaOrder))
      }
    } else {
      lastOrder.order_items.push({
        material_code: biofarmaOrder.produk,
        batches: [formatBatchV2(biofarmaOrder)]
      })
    }
  } else {
    // order ready
    if (lastNoDO !== null && lastOrder && lastOrder.customer_code) {
      //   create new order
      await createOrder(lastOrder)
    }
    // create new entry no_do
    lastOrder = {
      vendor_code: '00',
      customer_code: biofarmaOrder.kode_area ? biofarmaOrder.kode_area.toString() : '',
      sales_ref: '',
      delivery_number: biofarmaOrder.no_do,
      service_type: biofarmaOrder.service_type,
      no_document: biofarmaOrder.no_document,
      released_date: biofarmaOrder.released_date,
      notes: biofarmaOrder.notes,
      order_items: [{
        material_code: biofarmaOrder.produk,
        batches: [formatBatchV2(biofarmaOrder)]
      }],
      activity_id: ACTIVITY_BIOFARMA,
      isV2: biofarmaOrder.isV2,
    }
  }
  if (isLastData()) {
    // create last order
    await createOrder(lastOrder)
  }
}

function formatBatchV2(biofarmaOrder) {
  return {
    code: biofarmaOrder.no_batch,
    expired_date: moment(biofarmaOrder.expired_date).format('YYYY-MM-DD'),
    production_date: '',
    manufacture_name: 'Biofarma',
    qty: biofarmaOrder.jm_dosis,
    activity_id: ACTIVITY_BIOFARMA,
  }
}

function sameQtySMILE(orderSmile) {
  // check every item & batch same qty
  logger.info({ do: lastOrder.delivery_number })
  let isValid = true
  lastOrder.order_items.forEach(biofarmaItem => {
    const smileItem = orderSmile.order_items.find(order_item => {
      return order_item.material ? order_item.material.code === biofarmaItem.material_code : order_item.master_material.code === biofarmaItem.material_code
    })
    if (!smileItem) isValid = false
    else {
      logger.info({ material_code: isValid })
      biofarmaItem.batches.forEach(biofarmaBatch => {
        const smileBatch = smileItem.order_stocks.find(order_stock => {
          return order_stock.stock.batch.code === biofarmaBatch.code
        })
        if (!smileBatch) isValid = false
        logger.info({ batch_code: isValid })
        if (smileBatch && smileBatch.allocated_qty !== biofarmaBatch.qty) isValid = false
        logger.info({ qty: isValid })
      })
    }
  })
  return isValid
}

let lastNoDO = null
let lastOrder = {}
const excludeName = [
  'COVID-19 VACCINE MODERNA :EUA2159700143A1',
  'VAKSIN COVID 19 SINOPHARM DUS 1 VIAL @1 DS (HIBAH UEA)'
]
async function processBiofarmaOrder({ type, orders = [], isV2 }) {
  // filter only not null no_do
  orders = orders.filter(item => {
    if (item['NOMOR DO'] !== null) {
      return item
    } else {
      lastData++
    }
  })
  orders = orders.filter(item => {
    if (item['TUJUAN PENGIRIMAN'].indexOf('Gudang') >= 0
      || item['TUJUAN PENGIRIMAN'].indexOf('P2P') >= 0) {
      return item
    } else {
      lastData++
    }
  })
  orders = orders.filter(item => {
    if (!excludeName.includes(item['NAMA PRODUK'])) return item
    else lastData++
  })

  const nomor_do = _.keys(_.groupBy(orders, 'NOMOR DO'))

  const dataSmileOrders = await models.Order.findAll({
    where: [
      { delivery_number: nomor_do },
      { status: { [Op.not]: ORDER_STATUS.CANCELED } }
    ],
    without_comments: true
  })


  let biofarmaOrders = []

  for (let order of orders) {
    const formattedData = mapBiofarmaToSmile(type, order)

    const selectedOrder = dataSmileOrders.filter(it => it.delivery_number == formattedData.no_do)

    if (selectedOrder.length > 0) formattedData.exist_smile = selectedOrder[0].id
    else formattedData.exist_smile = null

    biofarmaOrders.push(formattedData)

    formattedData.isV2 = isV2
    if (isV2) await prepareOrderSmileV2(formattedData)
    else await prepareOrderSmile(formattedData)

    // update last do
    lastData++
    lastNoDO = formattedData.no_do
  }

  console.log('Data biofarma order ', biofarmaOrders.length)

  const t = await models.sequelize.transaction()

  try {
    await models.BiofarmaOrder.bulkCreate(biofarmaOrders, {
      ignoreDuplicates: true,
      updateOnDuplicate: models.BiofarmaOrder.updateOnDuplicate(),
      transaction: t
    })

    await t.commit()
  } catch (err) {
    console.error(err)
    await t.rollback()
  }
  
}

async function getBiofarmaToken() {
  try {
    const resLogin = await axios({
      method: 'POST',
      url: `${BIOFARMA_URL}/api/auth/login`,
      data: {
        username: BIOFARMA_USER,
        password: BIOFARMA_PASSWORD
      }
    })
    return resLogin.data.access_token
  } catch (error) {
    return Error(error)
  }
}

export async function createBiofarmaOrders({ type, monthly = false, filterDate, isV2 = false }) {
  lastNoDO = null
  let endpoint = ''
  if (type === 'provinsi') {
    endpoint = '/api/public/get-transaksi-provinsi'
  } else if (type === 'hub') {
    endpoint = '/api/public/get-transaksi-hub'
  }
  const biofarmaDataURL = `${BIOFARMA_URL}${endpoint}`
  const token = await getBiofarmaToken()
  const headers = { Authorization: `Bearer ${token}` }

  const perPage = 1
  let filter = {
    search: '',
    start_date: `${BIOFARMA_STARTDATE}`,
    show: perPage,
  }
  if (monthly) filter.start_date = moment().subtract(60, 'days').format('YYYY-MM-DD')
  if (filterDate) {
    filter.start_date = filterDate.start_date || ''
    filter.end_date = filterDate.end_date || ''
  }
  
  const { data: firstData } = await axios({
    method: 'POST',
    url: biofarmaDataURL,
    headers: headers,
    data: filter
  })

  logger.info({
    type: type,
    perPage: filter?.show,
    start_date: filter?.start_date,
    end_date: filter?.end_date,
    lastData,
    tanggal_do: firstData.data.length > 0 ? firstData.data[0]['TANGGAL DO'] : '-'
  })
  totalData = firstData.total
  console.log('totalData', totalData)

  if (totalData > 0) {
    filter = {
      ...filter,
      show: totalData
    }
    const { data: respBiofarma } = await axios({
      method: 'POST',
      url: biofarmaDataURL,
      headers: headers,
      data: filter
    })
    let { data: dataDO } = respBiofarma
    await processBiofarmaOrder({
      type,
      orders: dataDO.length > 0 ? dataDO : [],
      isV2
    })
  }
}


export async function createBiofarmaSMDVOrders({ start_date = null, end_date = null }) {
  const resultProvinsi = await getBiofarmaSMDV({ type: 'provinsi', start_date, end_date })
  const resultHub = await getBiofarmaSMDV({ type: 'hub', start_date, end_date })

  return {
    result_provinsi: resultProvinsi ? resultProvinsi.message : 'Failed to insert data',
    result_hub: resultHub ? resultHub.message : 'Failed to insert data'
  }
}


async function requestDataSMDV({ type, headers, filter }) {
  let endpoint = ''
  if (type == 'provinsi')
    endpoint = '/api/public/get-data-dashboard-provinsi'
  else if (type == 'hub')
    endpoint = '/api/public/get-data-dashboard-hub'

  const biofarmaDataURL = `${BIOFARMA_URL}${endpoint}`

  let result = await axios({
    method: 'POST',
    url: biofarmaDataURL,
    headers: headers,
    data: filter
  })

  logger.info({
    url: biofarmaDataURL,
    perPage: filter?.show,
    start_date: filter.start_date,
    end_date: filter.end_date
  })

  return result
}

export async function getBiofarmaSMDV({ type = 'provinsi', start_date = null, end_date = null }) {

  const token = await getBiofarmaToken()
  const headers = { Authorization: `Bearer ${token}` }

  let dt = new Date()
  let prevDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - 1)
  if (!start_date) start_date = moment(prevDate).format('YYYY-MM-DD')
  if (!end_date) end_date = start_date

  const perPage = 100000
  let filter = {
    search: '',
    start_date,
    end_date,
    show: perPage,
  }

  let { data: dataBiofarma } = await requestDataSMDV({ type, headers, filter })

  let totalDataSMDV = dataBiofarma.total

  if (totalDataSMDV > 0) {

    if (totalDataSMDV > dataBiofarma.data.length) {
      filter.show = totalDataSMDV

      dataBiofarma = (await requestDataSMDV({ type, headers, filter })).data

      totalDataSMDV = dataBiofarma.total
    }

    const t = await models.sequelize.transaction()
    try {
      let { data } = dataBiofarma
      data = data.map(item => {
        var biofarma_id = item.no
        delete item.no
        return {
          biofarma_id,
          ...item
        }
      })
      await models.BiofarmaSMDVOrder.bulkCreate(data, {
        ignoreDuplicates: true,
        updateOnDuplicate: models.BiofarmaSMDVOrder.updateOnDuplicate(),
        transaction: t
      })

      await t.commit()

      return {
        message: data.length + ' data inserted'
      }
    } catch (err) {
      await t.rollback()
      return null
    }
  } else return { message: 'Data is empty' }
}

const changeKodeArea = [
  { src: 1608, dest: 1609 },
  { src: 1609, dest: 1608 }
]

function mapBiofarmaToSmile(type, item = {}) {
  let kodeArea = item['KODE AREA']
  changeKodeArea.forEach(kode => {
    if (item['KODE AREA'] === kode.src) {
      kodeArea = kode.dest
    }
  })

  return {
    no_do: item['NOMOR DO'],
    tanggal_do: item['TANGGAL DO'],
    no_po: item['NOMOR PO'],
    kode_area: kodeArea,
    pengirim: item['PENGIRIM'],
    tujuan: item['TUJUAN PENGIRIMAN'],
    alamat: item['ALAMAT'],
    produk: item['NAMA PRODUK'],
    no_batch: item['NO BATCH'],
    expired_date: item['EXPIRED DATE'],
    jm_vial: item['JUMLAH VIAL'],
    jm_dosis: item['JUMLAH DOSIS'],
    jm_vial_terima: item['JUMLAH VIAL DITERIMA'],
    jm_dosis_terima: item['JUMLAH DOSIS DITERIMA'],
    status: item['STATUS'],
    tanggal_kirim: item['TANGGAL KIRIM'],
    tanggal_terima: item['TANGGAL TERIMA'],
    biofarma_type: type,
    service_type: item['JENIS LAYANAN'] || null,
    no_document: item['NO SURAT'] || null,
    released_date: item['TANGGAL RELEASE'] || null,
    notes: item['KETERANGAN'] || null,
    code_product_kemenkes: item['KODE PRODUK KEMENKES'] || null,
    entrance_type: item['ENTRANCETYPE'] || null,
    grant_country: item['GRANTCOUNTRY'] || null,
    manufacture_country: item['MANUFACTURCOUNTRY'] || null,
  }
}

export async function checkBiofarmaOrder({ filterDate = null, monthly = false, isV2 = false }) {
  lastData = 1
  await createBiofarmaOrders({ type: 'provinsi', monthly, filterDate, isV2 })
  lastData = 1
  await createBiofarmaOrders({ type: 'hub', monthly, filterDate, isV2 })

  console.log('biofarma_order_finished')
  process.exit(0)
}

export async function checkDeleteBiofarma(req) {
  const result = {}
  await models.DeleteBiofarma.destroy({ truncate: true })
  await Promise.all([
    deleteBiofarmaOrder('provinsi', req)
      .then(res => result['provinsi'] = res),
    deleteBiofarmaOrder('hub', req)
      .then(res => result['hub'] = res)
  ])
  return result
}

export async function deleteBiofarmaOrder(type = 'provinsi', req) {
  try {
    // let endpoint = ''
    // if(type === 'provinsi') {
    //   endpoint = '/api/public/get-transaksi-provinsi'
    // } else if(type === 'hub') {
    //   endpoint = '/api/public/get-transaksi-hub'
    // }
    // console.time(`get data biofarma ${type}`)
    // const biofarmaDataURL = `${BIOFARMA_URL}${endpoint}`
    // const token = await getBiofarmaToken()
    // const headers = { Authorization: `Bearer ${token}`}
    // const perPage = 1
    // let filter = {
    //   search: '',
    //   start_date: moment().subtract(60, 'days').format('YYYY-MM-DD'),
    //   show: perPage,
    // }
    // const { data: firstData } = await axios({
    //   method: 'POST',
    //   url: biofarmaDataURL,
    //   headers: headers,
    //   data: filter
    // })
    // totalData = firstData.total
    // filter = {
    //   ...filter,
    //   show: totalData
    // }
    // const { data: resBiofarma = {} } = await axios({
    //   method: 'POST',
    //   url: biofarmaDataURL,
    //   headers: headers,
    //   data: filter
    // })
    // const { data: dataBiofarma = [] } = resBiofarma
    // console.timeEnd(`get data biofarma ${type}`)
    const { start_date, end_date } = req.body
    const dataBiofarma = await models.DummyBiofarma.findAll({
      where: {
        type
      },
      raw: true
    })

    const noDos = dataBiofarma.map(item => item?.no_do)
    console.time(`get data biofarma order ${type}`)
    const dataOrder = await models.BiofarmaOrder.findAll({
      raw: true,
      attributes: ['id', 'no_do'],
      where: {
        no_do: noDos
      },
      order: [['tanggal_do', 'asc']]
    })
    // console.log(dataOrder, '==')
    console.timeEnd(`get data biofarma order ${type}`)
    const notFound = []
    const found = []
    dataBiofarma.forEach(item => {
      const find = dataOrder.find(iitem => iitem.no_do === item?.no_do)
      if (!find) notFound.push(item)
      else if (find) found.push(item['no_do'])
    })
    await models.DeleteBiofarma.bulkCreate(notFound, { ignoreDuplicates: true })
    return {
      notFound: notFound.length,
      found: found.length
    }
  } catch (err) {
    console.error(err)
  }
}

export async function runDeleteBiofarma(req, res, next) {
  try {
    const data = await checkDeleteBiofarma(req)
    return res.status(200).json({ message: 'success', data })
  } catch (err) {
    next(err)
  }
}

export async function getDataDummy(req, res, next) {
  try {
    next()
  } catch (err) {
    console.error(err)
    next(err)
  }
}

export async function getDataDelete(req, res, next) {
  try {
    next()
  } catch (err) {
    next(err)
  }
}
