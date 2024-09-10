import { formatWIB } from '../../../helpers/common'
import {
  ORDER_STATUS, getOrderStatusLabel
} from '../../../helpers/constants'
import models from '../../../models'

export async function formatOrderXLSQuery(req, res, next) {
  try {
    let orderCondition = {}
    if (req.condition) {
      orderCondition = req.condition
      req.condition = {}
    }

    const {
      purpose,
      entity_tag_id,
    } = req.query || {}

    const lang = req.headers['accept-language'] || 'id'


    let entityTag = {}
    if (entity_tag_id) {
      entityTag = {
        include: {
          association: 'entity_tags',
          attributes: ['id'],
        },
      }
    }

    req.include = [
      {
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
        }, {
          association: 'activity',
          attributes: ['id', 'name'],
        }],
      }
    ]


    if (purpose === 'purchase' || purpose === 'sales') {
      if (purpose === 'purchase') {
        if (entity_tag_id) {
          req.include[0].include[2].include = entityTag.include
          req.include[0].include[2].include.where = { id: Number(entity_tag_id) }
          req.include[0].include[2].include.required = true
          req.include[0].include[2].required = true
        }

      } else if (purpose === 'sales') {
        if (entity_tag_id) {
          req.include[0].include[3].include = entityTag.include
          req.include[0].include[3].include.where = { id: Number(entity_tag_id) }
          req.include[0].include[3].include.required = true
          req.include[0].include[3].required = true

        }
      }
    }

    let columnsWithTranslate = {
      order_id: {
        id: 'ID Order', en : 'Order ID'
      },
      status_label: {
        id: 'Status', en : 'Status'
      },
      customer_name: {
        id: 'Nama Customer', en : 'Customer Name'
        
      },
      vendor_name: {
        id: 'Nama Vendor', en : 'Vendor Name'
      },
      material_name: {
        id: 'Nama Material', en : 'Material Name'
      },
      reason_discard : {
        id : 'Alasan', en : 'Reason of Discard'
      },
      extermination_received_qty : {
        id : 'Jumlah dari Penerimaan', en : 'Quantity from Received'
      },
      extermination_discard_qty : {
        id : 'Jumlah dari Pembuangan', en : 'Quantity from Discard'
      },
      activity_name : {
        id : 'Nama Aktivitas', en : 'Activity Name'
      },
      created_by : {
        id : 'Dibuat oleh', en : 'Created by full name'
      },
      created_at : {
        id : 'Tanggal Dibuat', en : 'Created On'
      },
      updated_at : {
        id : 'Tanggal Diupdate', en : 'Updated On'
      },
      updated_by : {
        id : 'Diupdate oleh', en : 'Updated by full name'
      },
      batch_name : {
        id : 'Batch', en : 'Batch'
      },
      batch_expired_date : {
        id : 'Tanggal Kadaluwarsa Batch', en : 'Expired Date Batch'
      },
      quantity_per_batch : {
        id : 'Jumlah per Batch', en : 'Quantity per Batch'
      },
      service_type : {
        id : 'Tipe Service', en : 'Service Type'
      },
      no_document : {
        id : 'Nomor Dokumen', en : 'No Document'
      },
      comment_shipped : {
        id : 'Komentar Dikirim', en : 'Comment Shipped'
      },
      comment_fullfil : {
        id : 'Komentar Diterima', en : 'Comment Fulfilled'
      },
      cancelled_at : {
        id : 'Tanggal Dibatalkan', en : 'Cancelled At'
      },
      fulfilled_at : {
        id : 'Tanggal Diterima', en : 'Fulfilled At'
      },
      shipped_at : {
        id : 'Tanggal Dikirim', en : 'Shipped At'
      }
    }

    let xlsColumns = []

    for(let key in columnsWithTranslate){
      xlsColumns.push({
        key : key,
        title : columnsWithTranslate[key][lang]
      })
    }

    req.xlsColumns = xlsColumns

    const currentDate = new Date()
    req.xlsFilename = lang == 'en' ? `Disposal Shipping ${currentDate}` :  `Pengiriman Pemusnahan ${currentDate}`

    req.mappingContents = ({ data }) => {
      let item = {}
      const { order, order_stocks, master_material } = data

      let comment_shipped = []
      let comment_fullfil = []
      let comment_cancelled = []

      /*stock.forEach((stock) => {
              received_qty += stock.received_qty
            })*/

      //received_qty = stock.received_qty

      order?.order_comments.forEach((el) => {
        if (el.order_status === ORDER_STATUS.SHIPPED) {
          comment_shipped.push(el.comment)
        }
        else if (el.order_status === ORDER_STATUS.FULFILLED) {
          comment_fullfil.push(el.comment)
        }
        else if (el.order_status === ORDER_STATUS.CANCELED) {
          comment_cancelled.push(el.comment)
        }
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
        status_label: getOrderStatusLabel(order.status,lang),
        customer_name: order.customer_name,
        vendor_name: order.vendor_name,
        material_name: master_material?.name || '',
        reason_discard: lang == 'en' ? req.__(`field.transaction_reason.list.${data.reason_discard}`) || '' : data.reason_discard,
        extermination_received_qty: data.extermination_received_qty,
        extermination_discard_qty: data.extermination_discard_qty,

        activity_name: order.activity?.name || '',
        created_by: order.user_created_by?.fullname || '',
        updated_by: order.user_updated_by?.fullname || '',

        no_document: order.no_document,

        service_type,
        comment_shipped: comment_shipped.join(';'),
        comment_fullfil: comment_fullfil.join(';'),
        comment_cancelled: comment_cancelled.join(';'),
        cancelled_at: order.cancelled_at ? formatWIB(order.cancelled_at, 'YYYY-MM-DD HH:mm') : '',
        fulfilled_at: order.fulfilled_at ? formatWIB(order.fulfilled_at, 'YYYY-MM-DD HH:mm') : '',
        shipped_at: order.shipped_at ? formatWIB(order.shipped_at, 'YYYY-MM-DD HH:mm') : '',
        created_at: order.created_at ? formatWIB(order.created_at, 'YYYY-MM-DD HH:mm') : '',
        updated_at: order.updated_at ? formatWIB(order.updated_at, 'YYYY-MM-DD HH:mm') : '',
        //status_updated_at: order.status_updated_at ? formatWIB(order.status_updated_at, 'YYYY-MM-DD HH:mm') : '',

        batch_name: data.batch_name || '',
        batch_expired_date: data.batch_expired_date || '',
        quantity_per_batch: data.quantity_per_batch || ''
      }

      /*order_stocks.forEach((os) => {
              item = {
                ...item,
                batch_name: os?.stock?.batch?.code || '',
                batch_expired_date: os?.stock?.batch?.expired_date || '',
                quantity_per_batch: os?.stock?.batch ? os.allocated_qty : ''
              }
            }) */
      return item
    }

    next()
  } catch (err) {
    return next(err)
  }
}
