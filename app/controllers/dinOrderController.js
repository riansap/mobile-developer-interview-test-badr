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

const DIN_URL = process.env.DIN_URL
const DIN_USER = process.env.DIN_USER
const DIN_PASSWORD = process.env.DIN_PASSWORD
const DIN_SERVER = process.env.DIN_SERVER

const SMILE_URL = process.env.SMILE_URL

const ADMIN_USER = process.env.DIN_SMILE_USER
const ADMIN_PASS = process.env.DIN_SMILE_PASS

const BF_SMILE_USER = process.env.DIN_SMILE_USER
const BF_SMILE_PASS = process.env.DIN_SMILE_PASS

const orderCreated = []

let REQ_ERROR = []


async function createOrderSMILE(smileOrder) {
  const is_duplicate = orderCreated.includes(smileOrder.delivery_number)
  if (is_duplicate) {
    logger.info('================== check duplicate ===============', { is_duplicate, do: smileOrder.delivery_number })
  } else {
    const headers = await getSmileHeader(BF_SMILE_USER, BF_SMILE_PASS)

    const url = `${SMILE_URL}/v2/order/dropping`
    const payload = {
      url,
      method: 'POST',
      headers: headers,
      data: smileOrder,
    }

    publishWorker('http-worker', payload)

    /*console.log(payload)

    const result = await axios(payload)

    if (result.error) {
      REQ_ERROR.push({
        payload: smileOrder,
        error: result.error
      })
    }*/

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
      other_reason: 'Data DIN berubah',
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

async function getDinToken() {
  try {

    const data = new URLSearchParams()
    data.append('username', DIN_USER)
    data.append('password', DIN_PASSWORD)

    const resLogin = await axios({
      method: 'POST',
      url: `${DIN_URL}/v1/token`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    })


    return resLogin.data.access_token
  } catch (error) {
    return Error(error)
  }
}

let totalData = 0
let lastData = 1
function isLastData() {
  return lastData === totalData
}


export async function createDinOrder({ start_date = '', end_date = '' }) {
  try {

    REQ_ERROR = []

    const token = await getDinToken()

    const perPage = 1
    let filter = {
      search: '', start_date, end_date, page: 1, show: perPage
    }

    const dinURLData = `${DIN_URL}/v1/transaction/smile?server=${DIN_SERVER}`

    const headers = { Authorization: `Bearer ${token}` }

    const { data: firstData } = await axios({
      method: 'POST',
      url: dinURLData,
      headers: headers,
      data: filter
    })

    var { data: transactionDin } = firstData.data

    logger.info({
      perPage: filter?.show,
      start_date: filter.start_date,
      lastData,
      tanggal_do: transactionDin.length > 0 ? transactionDin[0]['tanggal_do'] : '-'
    })
    totalData = firstData.total

    if (totalData > 0) {
      filter = {
        ...filter,
        show: totalData
      }

      const { data: respDin } = await axios({
        method: 'POST',
        url: dinURLData,
        headers: headers,
        data: filter
      })

      var { data: respDinData } = respDin.data

      var dataDin = mapDinToSmile(respDinData)

      await processDinOrder(dataDin)

      return REQ_ERROR
    }
  } catch (error) {
    REQ_ERROR.push({
      payload: error.config ? JSON.parse(error.config.data) : {},
      error: error.message
    })
    return REQ_ERROR
  }
}

let lastNoDO = null
let lastOrder = {}
/*const excludeName = [
    'COVID-19 VACCINE MODERNA :EUA2159700143A1',
    'VAKSIN COVID 19 SINOPHARM DUS 1 VIAL @1 DS (HIBAH UEA)'
]*/

async function processDinOrder(orders = []) {
  try {
    orders = orders.filter(item => {
      if (item['no_do'] !== null) {
        return item
      } else {
        lastData++
      }
    })

    for (let order of orders) {

      // check order & insert
      let dinOrder = await models.DinOrder.findOne({
        where: [
          { no_do: order.no_do }
        ]
      })

      let { order_items } = order

      delete order.order_items

      if (!dinOrder) {
        dinOrder = await models.DinOrder.create(order)
      } else {
        dinOrder = await dinOrder.update(order)
      }

      const smileOrder = await models.Order.findOne({
        where: [
          { delivery_number: order.no_do },
          { status: { [Op.not]: ORDER_STATUS.CANCELED } }
        ],
        without_comments: true
      })

      if (smileOrder) {
        dinOrder.exist_smile = smileOrder.id
        await dinOrder.save()
      } else {
        dinOrder.exist_smile = null
        await dinOrder.save()
      }

      for (let orderItem of order_items) {
        orderItem.din_order_id = dinOrder.id

        let dinOrderItem = await models.DinOrderItem.findOne({
          where: [
            { din_order_id: orderItem.din_order_id },
            { kfa_code: orderItem.kfa_code }
          ]
        })

        if (!dinOrderItem) {
          dinOrderItem = await models.DinOrderItem.create(orderItem)
        } else {
          dinOrderItem = await dinOrderItem.update(orderItem)
        }
      }

      const dataDinOrder = {
        ...order,
        order_items
      }

      await prepareOrderSmileV2(dataDinOrder)
      // update last do
      lastData++
      lastNoDO = dinOrder.no_do
    }
  } catch (error) {
    REQ_ERROR.push({
      payload: error.config ? JSON.parse(error.config.data) : {},
      error: error.message
    })
    return REQ_ERROR
  }
}

let ACTIVITY_BIOFARMA = 8

async function prepareOrderSmileV2(biofarmaOrder = {}) {
  let { order_items } = biofarmaOrder


  const entityVendor = await models.MappingEntity.findOne({
    where : {id_satu_sehat : biofarmaOrder.kode_pengirim}
  })

  const entityCustomer = await models.MappingEntity.findOne({
    where : {id_satu_sehat : biofarmaOrder.kode_penerima}
  })

  let vendor = null
  let customer = null

  if(entityVendor)
    vendor = await models.Entity.findByPk(entityVendor?.id_entitas_smile)

  if(entityCustomer)
    customer = await models.Entity.findByPk(entityCustomer?.id_entitas_smile)

  let code = ''

  for (let product of order_items) {
    let material = await models.MasterMaterial.findOne({
      where: {
        kfa_code: product.kfa_code
      }
    })

    code = product.produk

    const getActivityQuery = `
    select mm.code from master_material_has_activities as mmha
    left join master_materials as mm on mm.id=mmha.master_material_id
    where activity_id = 6 and mm.is_vaccine in (0,1)
    and mm.code = $code
  `
    const getActivity = await models.sequelize.query(getActivityQuery, {
      bind: { code: code },
      logging: false,
      type: models.sequelize.QueryTypes.SELECT
    })
    ACTIVITY_BIOFARMA = getActivity.length > 0 ? 6 : 1
    let entityMaterial = null
    if (!material && vendor) {
      material = await models.MasterMaterial.create({
        name: product.produk,
        kfa_code: product.kfa_code,
        code: product.produk,
        pices_per_unit: 1,
        managed_in_batch: 1,
        status: 1,
        is_vaccine: 0,
        is_stockcount: 1,
        is_addremove: 1,
        is_openvial: 1,
        unit: ''
      })

      const itemEntityMaterial = {
        master_material_id: material.id,
        entity_id: vendor.id,
        min: 0, max: 0, on_hand_stock: product.jm_vial,
        allocated_stock: 0,
        total_open_vial: 0,
        extermination_discard_qty: 0, extermination_received_qty: 0, extermination_qty: 0,
        extermination_shipped_qty: 0
      }
      entityMaterial = await models.EntityMasterMaterial.create(itemEntityMaterial)
      await models.MasterMaterialActivities.create({
        master_material_id: material.id,
        activity_id: ACTIVITY_BIOFARMA
      })


    }
  }

  if (vendor) {
    if (lastNoDO !== biofarmaOrder.no_do) {
      // order ready
      if (lastNoDO !== null && lastOrder && lastOrder.customer_code) {
        //   create new order
        await createOrder(lastOrder)
      }
      // create new entry no_do
      lastOrder = {
        customer_code: customer ? customer.code : '',
        vendor_code: vendor ? vendor.code : null,
        sales_ref: '',
        delivery_number: biofarmaOrder.no_do,
        service_type: biofarmaOrder.service_type,
        no_document: biofarmaOrder.no_document,
        released_date: biofarmaOrder.tanggal_kirim,
        notes: biofarmaOrder.notes,
        order_items: [],
        activity_id: ACTIVITY_BIOFARMA,
        isV2: true,
        din_order_id : biofarmaOrder.id
      }

      for (let orderItem of order_items) {
        lastOrder.order_items.push({
          material_code: orderItem.produk,
          batches: [formatBatchV2(orderItem)]
        })
      }
    }
    //if (isLastData()) {
      // create last order
    await createOrder(lastOrder)
    //}
  }
}


function formatBatchV2(biofarmaOrder) {
  return {
    code: biofarmaOrder.no_batch,
    expired_date: moment(biofarmaOrder.expired_date).format('YYYY-MM-DD'),
    production_date: '',
    manufacture_name: 'Biofarma',
    qty: biofarmaOrder.jm_dosis || 0,
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

function mapDinToSmile(data) {
  var items = []
  for (var item of data) {
    var format = {
      no_do: item.ref_num,
      no_po: item.doc_num,
      din_type: item.code,
      kode_area: item?.penerima?.provinsi_id ?? '',

      pengirim: item?.pengirim?.type ?? '',
      nama_pengirim: item?.pengirim?.nama,
      tujuan: item?.penerima?.nama ?? '',
      type_penerima: item?.penerima?.type,
      alamat: item?.penerima?.alamat ?? '',
      status: item.status,
      tanggal_kirim: item.tanggal_kirim,
      tanggal_terima: item.tanggal_terima,
      service_type: item.jenis_layanan,
      no_document: item.line_ref ?? '',
      notes: item.note ?? '',
      tanggal_do: null,
      kode_pengirim: item?.pengirim?.kode,
      kode_penerima: item?.penerima?.kode,

      line: item.line,
      sumber_dana: item.sumber_dana,

      biaya_transport: item.biaya_transport,
      total_transaksi: item.total_transaksi,
      jenis_layanan: item.jenis_layanan,
      alamat_pengirim: item?.pengirim?.alamat,
      kodepos_pengirim: item?.pengirim?.kodepos,
      provinsi_pengirim: item?.pengirim?.provinsi,
      provinsi_id_pengirim: item?.pengirim?.provin,
      kabkota_pengirim: item?.pengirim?.kabkota,
      kabkota_id_pengirim: item?.pengirim?.kabkota_id,
      kecamatan_pengirim: item?.pengirim?.kecamatan,
      kecamatan_id_pengirim: item?.pengirim?.kecamatan_id,
      kelurahan_pengirim: item?.pengirim?.kelurahan,
      kelurahan_id_pengirim: item?.pengirim?.kelurahan_id,

      alamat_penerima: item?.penerima?.alamat,
      kodepos_penerima: item?.penerima?.kodepos,
      provinsi_penerima: item?.penerima?.provinsi,
      provinsi_id_penerima: item?.penerima?.provinsi_id,
      kabkota_penerima: item?.penerima?.kabkota,
      kabkota_id_penerima: item?.penerima?.kabkota_id,
      kecamatan_penerima: item?.penerima?.kecamatan,
      kecamatan_id_penerima: item?.penerima?.kecamatan_id,
      kelurahan_penerima: item?.penerima?.kelurahan,
      kelurahan_id_penerima: item?.penerima?.kelurahan_id,

      order_items: []
    }

    for (let produk of item.products) {
      format.tanggal_do = produk.tanggal_release
      format.order_items.push({
        produk: produk.product_name,
        kfa_code: produk.kfa_code,
        expired_date: produk.expired_date,
        jm_vial: produk.qty ?? 0,
        jm_dosis: produk.qty ?? 0,
        jm_vial_terima: produk.qty_accepted ?? 0,
        jm_dosis_terima: produk.qty_accepted ?? 0,
        entrance_type: produk.entrance_type,
        grant_country: produk.grant_country,
        manufacture_country: produk.manufacture_country,
        no_batch: produk.lot_no,
        released_date: produk.tanggal_release,
        production_date: produk.production_date == false ? null : produk.production_date,
        unit_price: produk.unit_price,
        total_price: produk.total_price,
        unit: produk.unit,
        tanggal_release: produk.tanggal_release,
        keterangan: produk.keterangan,
        note: produk.note
      })
    }

    items.push(format)
  }

  return items
}


export async function sslDinOrder(req, res, next) {

  const t = await models.sequelize.transaction()
  try {
    const item = req.body

    var sslDinOrder = {
      key_ssl : item.key,
      no_do: item.ref_num,
      no_po: item.doc_num,
      din_type: item.code,
      kode_area: item?.penerima?.provinsi_code ?? '',

      pengirim: item?.pengirim?.type ?? '',
      nama_pengirim: item?.pengirim?.nama,
      tujuan: item?.penerima?.nama ?? '',
      type_penerima: item?.penerima?.type,
      alamat: item?.penerima?.alamat ?? '',
      status: item.status,
      tanggal_kirim: item.tanggal_kirim,
      tanggal_terima: item.tanggal_terima,
      service_type: item.jenis_layanan,
      no_document: item.line_ref ?? '',
      notes: item.note ?? '',
      tanggal_do: null,
      kode_pengirim: item?.pengirim?.kode,
      kode_penerima: item?.penerima?.kode,

      line: item.line,
      sumber_dana: item?.sumber_dana ?? null,

      biaya_transport: item.biaya_transport,
      total_transaksi: item.total_transaksi,
      jenis_layanan: item.jenis_layanan,
      alamat_pengirim: item?.pengirim?.alamat,
      kodepos_pengirim: item?.pengirim?.kodepos,
      provinsi_pengirim: item?.pengirim?.provinsi,
      provinsi_id_pengirim: item?.pengirim?.provinsi_code,
      kabkota_pengirim: item?.pengirim?.kabkota,
      kabkota_id_pengirim: item?.pengirim?.kabkota_code,
      kecamatan_pengirim: item?.pengirim?.kecamatan,
      kecamatan_id_pengirim: item?.pengirim?.kecamatan_code,
      kelurahan_pengirim: item?.pengirim?.kelurahan,
      kelurahan_id_pengirim: item?.pengirim?.kelurahan_code,

      alamat_penerima: item?.penerima?.alamat,
      kodepos_penerima: item?.penerima?.kodepos,
      provinsi_penerima: item?.penerima?.provinsi,
      provinsi_id_penerima: item?.penerima?.provinsi_code,
      kabkota_penerima: item?.penerima?.kabkota,
      kabkota_id_penerima: item?.penerima?.kabkota_code,
      kecamatan_penerima: item?.penerima?.kecamatan,
      kecamatan_id_penerima: item?.penerima?.kecamatan_code,
      kelurahan_penerima: item?.penerima?.kelurahan,
      kelurahan_id_penerima: item?.penerima?.kelurahan_code,

      line_ref : item.line_ref ?? '',
      carrier_ref : item.carrier_ref ?? '',
      carrier : item.carrier ?? ''
    }

    let dinOrder = await models.DinOrder.findOne({
      where: [
        { key_ssl: sslDinOrder.key_ssl }
      ]
    })

    if (!dinOrder) {
      dinOrder = await models.DinOrder.create(sslDinOrder, { transaction: t })
    } else {
      dinOrder = await dinOrder.update(sslDinOrder, { transaction: t })
    }

    const { data } = item

    let order_items = []
    for (let produk of data) {
      let orderItem = {
        din_order_id : dinOrder.id,
        produk: produk.product_name,
        kfa_code: produk.kfa_code,
        expired_date: produk.tgl_kadaluarsa ?? null,
        jm_vial: produk.qty ?? 0,
        jm_dosis: produk.qty ?? 0,
        jm_vial_terima: produk.qty_accepted ?? 0,
        jm_dosis_terima: produk.qty_accepted ?? 0,
        entrance_type: produk.entrance_type ?? '',
        grant_country: produk.grant_country ?? '',
        manufacture_country: produk.manufacture_country ?? '',
        no_batch: produk.lot_no ?? '',
        released_date: produk.tanggal_release ?? null,
        production_date: produk.tgl_produksi == false ? null : (produk.tgl_produksi || null),
        unit_price: produk.unit_price,
        total_price: produk.total_price,
        unit: produk.unit,
        tanggal_release: produk.tanggal_release ?? null,
        keterangan: produk.keterangan,
        note: produk.note,
        lot_no : produk.lot_no
      }

      let dinOrderItem = await models.DinOrderItem.findOne({
        where: [
          { din_order_id: orderItem.din_order_id },
          { kfa_code: orderItem.kfa_code }
        ]
      })

      if (!dinOrderItem) {
        dinOrderItem = await models.DinOrderItem.create(orderItem, {transaction : t})
      } else {
        dinOrderItem = await dinOrderItem.update(orderItem, {transaction : t})
      }

      order_items.push(orderItem)
    }

    await t.commit()

    sslDinOrder.id = dinOrder.id
    const dataDinOrder = {
      ...sslDinOrder,
      order_items
    }

    await prepareOrderSmileV2(dataDinOrder)

    res.status(200).json({
      success: true,
      code : 200,
      message: "Success post data"
    })

  } catch (err) {
    console.log(err)
    await t.rollback()
    next(err)
  }
}

