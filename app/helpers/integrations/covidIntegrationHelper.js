import { ENTITY_TYPE, getStockStatusLabel, TRANSACTION_TYPE } from '../constants'
import moment from 'moment'
import models from '../../models'
// import batch from '../models/batch'
// import cfg from '../../config/database'
// import mysql from 'mysql'

// const env = process.env.NODE_ENV.trim() || 'development'
// const config = cfg[env]

export function formatUpdatePayload(order, token, comment = '') {
  let endpoint = ''
  // puskesmas-rs/penerimaan
  switch(order.customer.type) {
  case ENTITY_TYPE.PROVINSI:
    endpoint = '/dinkes-provinsi-penerimaan'
    break
  case ENTITY_TYPE.KOTA:
    endpoint = '/dinkes-kabkota-penerimaan'
    break
  case ENTITY_TYPE.FASKES:
    endpoint = '/puskesmas-rs/penerimaan'
    break
  }

  let orderItems = []
  for(let i = 0; i < order.order_items.length; i++) {
    let orderItem = order.order_items[i]
    for(let j = 0; j < orderItem.order_stocks.length; j++) {
      if(orderItem.material.is_vaccine) {
        orderItems.push({
          'material_code': orderItem.material.code,
          'material_name': orderItem.material.name,
          'batch_code': orderItem.order_stocks[j].stock.batch?.code || null,
          'expired_date': orderItem.order_stocks[j].stock.batch?.expired_date || '',
          'production_date': orderItem.order_stocks[j].stock.batch?.production_date || '',
          'manufacture_name': orderItem.order_stocks[j].stock.batch?.manufacture_name || '',
          'received_qty': orderItem.order_stocks[j].received_qty,
          'allocated_qty': orderItem.order_stocks[j].allocated_qty
        })
      }
    }
  }
  return {
    endpoint: endpoint,
    body: {
      'order_id': order.id,
      'vendor_name': order.vendor.name,
      'vendor_code': order.vendor.code,
      'customer_name': order.customer.name,
      'customer_code': order.customer.code,
      'updated_by': order.user_updated_by.username,
      'updated_at': order.updated_at,
      'shipped_at': order.shipped_at,
      'order_tag': 'COVID-19',
      'comment': comment,
      'order_items': orderItems
    },
    token: token
  }
}

export function formatCreatePayload(order, token) {
  let endpoint = ''
  let is_allocated = true
  let urlFaskes = process.env.COVID_FASKES_URL
  let urlKota = process.env.COVID_KOTA_URL
  let fieldQty = 'JUMLAH_SASARAN'
  switch(order.customer.type) {
  case ENTITY_TYPE.PROVINSI:
    endpoint = `${urlKota}/provinsi/distribusi/kabkota/${order.customer.code}`
    fieldQty = 'JUMLAH_PENERIMA'
    break
  case ENTITY_TYPE.KOTA:
    endpoint = `${urlFaskes}/kabkota/distribusi/faskes/${order.customer.code}`
    break
  }
  let formatOrderItems = []
  for(let i = 0; i < order.order_items.length; i++) {
    let batches = []
    let qty = 0
    let orderStocks = order.order_items[i].order_stocks
    let material = order.order_items[i].material
    for(let j = 0; j < orderStocks.length; j++) {
      if(material.is_vaccine) {
        if(orderStocks[j].stock.batch_id) {
          let production_date = orderStocks[j].stock.batch?.production_date || null
          if(production_date) production_date = moment(production_date).format('YYYY-MM-DD')
          batches.push({
            code: orderStocks[j].stock.batch.code,
            expired_date: moment(orderStocks[j].stock.batch.expired_date).format('YYYY-MM-DD'),
            production_date: production_date,
            manufacture_name: orderStocks[j].stock.batch.manufacture_name,
            qty: orderStocks[j].received_qty
          })
        } else {
          qty += orderStocks[j].received_qty
        }
      }
    }
    formatOrderItems.push({
      material_code: material.code,
      batches: batches,
      qty: qty
    })
  }
  return {
    endpoint: endpoint,
    smile_token: token,
    order_items: formatOrderItems,
    is_allocated: is_allocated,
    is_kpcpen: 1,
    qty_kpcpen: 0,
    master_order_id: order.id,
    fieldQty: fieldQty
  }
}

export async function formatUpdateTransactionPayload(transactions = []) {
  const covidTransaction = []
  const covidDiscardTransaction = []
  
  for(let i =  0; i < transactions.length; i++) {
    let transaction = transactions[i]
    console.log('find material...')
    let material = await models.Material.findOne({
      where: [{
        id: parseInt(transaction.material_id)
      }, {
        is_vaccine: 1
      }], 
      include: { association: 'material_tags', where: { title:'COVID-19' }, required: true} 
    })
    if(material) {
      console.log('material is found')
      if(transaction.transaction_type_id === TRANSACTION_TYPE.ISSUES 
        || 
        transaction.transaction_type_id === TRANSACTION_TYPE.DISCARDS) {
        console.log('input data transaction...')
        // 
        let vendor = await models.Entity.findByPk(transaction.entity_id)
        let customer = await models.Entity.findByPk(transaction.customer_id)
        let user = await models.User.findByPk(transaction.updated_by)
        let data = {
          transaction_id: transaction.id.toString(),
          status: getStockStatusLabel(transaction.status),
          material_code: material.code,
          material_name: material.name,
          batch_code: transaction.batch?.code || '-',
          expired_date: transaction.batch?.expired_date || '-',
          production_date: transaction.batch?.production_date || '-',
          manufacture_name: transaction.batch?.manufacture_name || '-',
          vendor_name: vendor?.name || '-',
          vendor_code: vendor?.code || '-',
          customer_name: customer?.name || '-',
          customer_code: customer?.code || '-',
          change_qty: transaction.change_qty,
          updated_by: user.username,
          updated_at: transaction.created_at
        }
        if(transaction.transaction_type_id === TRANSACTION_TYPE.ISSUES) {
          covidTransaction.push(data)
        }
        else if(transaction.transaction_type_id === TRANSACTION_TYPE.DISCARDS) {
          console.log('bulk transaction into array')
          covidDiscardTransaction.push(data)
        }
      }
    }
  }

  let payload = []

  if(covidTransaction.length) {
    payload.push({
      endpoint: '/puskesmas-rs/pengeluaran',
      body: { data: covidTransaction }
    })
  }
  if(covidDiscardTransaction.length) {
    payload.push({
      endpoint: '/repport/vaksin-rusak',
      body: { data: covidDiscardTransaction }
    })
  }
  return payload
}