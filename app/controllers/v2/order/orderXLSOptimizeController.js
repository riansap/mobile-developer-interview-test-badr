import { formatWIB } from '../../../helpers/common'
import stream from 'stream'
import {
  ORDER_STATUS, getOrderStatusLabel,
} from '../../../helpers/constants'
import { commonLists } from '../../../helpers/xls/excelTemplate'
import { getOrderComments, getOrderItems, getOrdersData, getOrderStocks } from './orderNormalController'

export async function formatOrderXLSQuery(req, res, next) {
  try {
    const {
      queryParam = {}
    } = req

    const orders = await getOrdersData(queryParam)
    const orderId = orders.map((order) => order.id)
    const orderItems = await getOrderItems(orderId)
    const oderItemId = orderItems.map((orderItem) => orderItem.id)
    const orderStocks = await getOrderStocks(oderItemId)
    const orderComments = await getOrderComments(orderId)

    const data = []
    for (let index = 0; index < orderItems.length; index++) {
      let item = {}
      const orderItem = orderItems[index]
      const master_material = orderItem.master_material
      const order_stocks = orderStocks.filter((orderStock) => orderStock.order_item_id === orderItem.id)
      const order = orders.find((order) => order.id === orderItem.order_id)
      const order_comments = orderComments.filter((orderComment) => orderComment.order_id === order.id)

      let received_qty = 0
      let comment_shipped = []
      let comment_fullfil = []

      if (order_stocks) {
        order_stocks.forEach((stock) => {
          received_qty += stock.received_qty
        })
      }

      if (order_comments) {
        order_comments.forEach((el) => {
          if (el.order_status === ORDER_STATUS.SHIPPED) {
            comment_shipped.push(el.comment)
          }
          else if (el.order_status === ORDER_STATUS.FULFILLED) {
            comment_fullfil.push(el.comment)
          }
        })
      }

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
        ...orderItem,
        status_label: statusLabel,
        customer_name: order.customer?.name || '',
        vendor_name: order.vendor?.name || '',
        material_name: master_material?.name || '',
        order_item_reason: orderItem.reason,
        ordered_qty: orderItem.qty,
        received_qty,
        activity_name: order.activity?.name || '',
        created_by: order.user_created_by?.firstname + order.user_created_by?.lastname || '',
        updated_by: order.user_updated_by?.firstname + order.user_updated_by?.lastname || '',
        delivery_number: order.delivery_number,
        no_document: order.no_document,
        released_date: order.released_date,
        notes: order.notes,
        service_type,
        comment_shipped: comment_shipped.join(';'),
        comment_fullfil: comment_fullfil.join(';'),
        confirmed_at: order.confirmed_at ? formatWIB(order.confirmed_at, 'YYYY-MM-DD HH:mm') : '',
        allocated_at: order.allocated_at ? formatWIB(order.allocated_at, 'YYYY-MM-DD HH:mm') : '',
        shipped_at: order.shipped_at ? formatWIB(order.shipped_at, 'YYYY-MM-DD HH:mm') : '',
        created_at: order.created_at ? formatWIB(order.created_at, 'YYYY-MM-DD HH:mm') : '',
        updated_at: order.updated_at ? formatWIB(order.updated_at, 'YYYY-MM-DD HH:mm') : '',
        batch_name: orderItem.order_stocks.stock.batch.code || '',
        batch_expired_date: orderItem.order_stocks.stock.batch.expired_date || '',
        quantity_per_batch: orderItem.quantity_per_batch || ''
      }
      data.push(item)
    }

    let columns = [
      { key: 'order_id', title: 'Order ID' },
      { key: 'status_label', title: 'Status' },
      { key: 'customer_name', title: 'Customer Name' },
      { key: 'vendor_name', title: 'Vendor Name' },
      { key: 'material_name', title: 'Material Name' },
      { key: 'order_item_reason', title: 'Order Item Reason' },
      { key: 'ordered_qty', title: 'Quantity Ordered' },
      { key: 'received_qty', title: 'Quantity Fulfilled' },
      { key: 'activity_name', title: 'Activity Name' },
      { key: 'created_by', title: 'Created by full name' },
      { key: 'created_at', title: 'Created On' },
      { key: 'updated_at', title: 'Updated On' },
      { key: 'updated_by', title: 'Status updated by full name' },
      //{ key: 'status_updated_at', title: 'Status updated on' },
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

    const workbook = commonLists(data, columns, 'Order Item')
    const currentDate = new Date()
    const filename = `Orders ${currentDate}`

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
    return next(err)
  }
}
