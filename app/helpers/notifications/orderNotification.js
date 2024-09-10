import moment from 'moment'
import models from '../../models'

import { ORDER_STATUS, ORDER_TYPE, STATUS, NOTIFICATION_TYPE } from '../constants'
import { publishWorker } from '../services/rabbitmqHelper'
import { recapNotification, sendMultiNotif } from './notificationService'

export async function generateOrderNotification(order) {  
  try {
    const customers = await models.User.findAll({
      where: {
        entity_id: order.customer_id,
        status: STATUS.ACTIVE
      }
    })

    const vendors = await models.User.findAll({
      where: {
        entity_id: order.vendor_id,
        status: STATUS.ACTIVE
      }
    })

    const message = formatOrderMessage(order)

    const dataNotif = []

    if (!message.text) return

    const payload = {
      message: message.text,
      title: `Update Status Order ${order.id}`,
      type: message.type,
      action_url: null,
      media: ['fcm']
    }
    if (message.send_to === 'vendor' || message.send_to === 'both') {
      for(const vendor of vendors) {
        const vendorPayload = {
          ...payload,
          user: vendor,
          province_id: order.vendor.province_id,
          regency_id: order.vendor.regency_id,
        }
        dataNotif.push(vendorPayload)
        await sendMultiNotif(vendorPayload)
      }
    }
    
    if (message.send_to === 'customer' || message.send_to === 'both') {
      for(const customer of customers) {
        const customerPayload = {
          ...payload,
          user: customer,
          province_id: order.customer.province_id,
          regency_id: order.customer.regency_id,
        }
        dataNotif.push(customerPayload)
        await sendMultiNotif(customerPayload)
      }
    }

    return dataNotif
  } catch (err) {
    console.log(err)
    return err
  }
}

function formatOrderMessage(order) {
  let message
  let materialName = order.order_items.map(el => { return el.master_material?.name })
  let activityName = order?.activity?.name
  let userField, dateField, fullname, date = ''
  userField = 'user_created_by'
  dateField = 'created_at'
  fullname = getFullname(order[userField])
  date = getDatetime(order[dateField])
  let isNew = order.created_at.toString() === order.updated_at.toString()
  switch(order.status) {
  case ORDER_STATUS.PENDING:
    if(isNew) {
      message = {
        text: `SMILE-ID Pesanan baru ${order.id} ${activityName} untuk ${materialName} telah dilakukan ${order.customer.name} kepada ${order.vendor.name} oleh ${fullname} pada ${date}`,
        send_to: 'vendor',
        type: NOTIFICATION_TYPE.ORDER_CREATE
      }
    }
    break
  case ORDER_STATUS.CONFIRMED:
    if(order.type === ORDER_TYPE.DROPPING && isNew) {
      message = {
        text: `SMILE-ID Pesanan baru ${order.id} ${activityName} untuk ${materialName} telah dilakukan ${order.customer.name} kepada ${order.vendor.name} oleh ${fullname} pada ${date}`,
        send_to: 'both',
        type: NOTIFICATION_TYPE.ORDER_CREATE
      }
    }


    message = {
      text: `SMILE-ID Pesanan ${order.id} ${activityName} untuk ${materialName} telah diterima ${order.customer.name} dari ${order.vendor.name} oleh ${fullname} pada ${date}`,
      send_to: 'customer',
      type: NOTIFICATION_TYPE.ORDER_CONFIRM
    }
    break
  case ORDER_STATUS.SHIPPED:
    userField = 'user_shipped_by'
    dateField = 'shipped_at'
    fullname = getFullname(order[userField])
    date = getDatetime(order[dateField])
    message = {
      text: `SMILE-ID Pesanan ${order.id} ${activityName} untuk ${materialName} telah dikirim oleh ${order.vendor.name} untuk ${order.customer.name} pada ${date}. Jika material sudah diterima secara fisik maka segera klik terima.`,
      send_to: 'both',
      type: NOTIFICATION_TYPE.ORDER_SHIP
    }
    break
  case ORDER_STATUS.FULFILLED:
    userField = 'user_fulfilled_by'
    dateField = 'fulfilled_at'
    fullname = getFullname(order[userField])
    date = getDatetime(order[dateField], 'YYYY-MM-DD')
    message = {
      text: `SMILE-ID Pesanan ${order.id} ${activityName} untuk ${materialName} telah diterima ${order.customer.name} dari ${order.vendor.name} pada ${date}`,
      send_to: 'vendor',
      type: NOTIFICATION_TYPE.ORDER_FULFILL
    }
    break
  }

  return message
}

function getFullname(user) {
  if(!user?.lastname) {
    return user?.firstname || ''
  }
  return user?.firstname+' '+ user?.lastname
}

function getDatetime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  return moment(date).format(format)
}

export async function generateReportOrderNotif(form, senders = []) {
  let { material, arrived_date, arrived_qty, batch, entity, vendorIds } = form
  let line1 = `SMILE-ID Terjadi kedatangan ${material.name} tgl ${arrived_date};`
  let line2 = `${arrived_qty}dosis; batch${batch.code} belum ada di SMILE. (${entity.name})`
  let message = `${line1}${line2}`
  const title = 'Report Order Covid'
  const data = {
    material_id: material.id,
    entity_id: entity.id,
    batch_code: batch.code,
    batch_expired: batch.expired_at,
    batch_production: batch.production_date,
    arrived_date,
    arrived_qty,
    message: message
  }
  // send to admin
  // console.log(data)
  let res = await models.OrderReport.create(data)
  console.log(res)
  for(let i = 0; i < senders.length; i++) {
    // send to customer & vendor
    if(message && senders[i].mobile_phone) {
      let payload = { mobile: senders[i].mobile_phone, message: message }
      await publishWorker('whatsapp', payload)
    }
    for(let j = 0; j < vendorIds.length; j++) {
      await recapNotification({
        entity_id: vendorIds[j].id,
        title: title,
        message: message
      })
    }
  }
}
