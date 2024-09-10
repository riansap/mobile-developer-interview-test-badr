import { formatWIB } from '../../../helpers/common'
import {
  ORDER_STATUS, getOrderStatusLabel,
} from '../../../helpers/constants'

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


    let entityTag = {}
    if (entity_tag_id) {
      entityTag = {
        include: {
          association: 'entity_tags',
          attributes: ['id'],
        },
      }
    }

    req.include = [{
      association: 'order',
      where: orderCondition,
      required : true,
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
        paranoid : false
      }],
    }]


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

    req.xlsColumns = [
      { key: 'order_id', title: 'Order ID' },
      { key: 'status_label', title: 'Status' },
      { key: 'customer_name', title: 'Customer Name' },
      { key: 'vendor_name', title: 'Vendor Name' },
      { key: 'material_name_kfa', title: 'Material Name (Zat Aktif + Kekuatan)'},
      { key: 'material_name', title: 'Material Name (Zat Aktif + Kekuatan + Merk Dagang)' },
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

    const currentDate = new Date()
    req.xlsFilename = `Orders ${currentDate}`

    req.mappingContents = ({ data }) => {
      let item = {}
      const { order, order_stocks, master_material } = data
      const {mapping_master_material} = master_material

      let received_qty = 0
      let comment_shipped = []
      let comment_fullfil = []

      if (order_stocks) {
        order_stocks.forEach((stock) => {
          received_qty += stock.received_qty
        })
      }

      if (order.order_comments) {
        order.order_comments.forEach((el) => {
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
        ...data.dataValues,
        status_label: statusLabel,
        customer_name: order.customer_name,
        vendor_name: order.vendor_name,
        material_name_kfa: mapping_master_material?.name_kfa_product_template || '',
        material_name: master_material?.name || '',
        order_item_reason: data.reason,
        ordered_qty: data.qty,
        received_qty,
        activity_name: order.activity?.name || '',
        created_by: order.user_created_by?.fullname || '',
        updated_by: order.user_updated_by?.fullname || '',
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
      })*/
      return item
    }

    next()
  } catch (err) {
    return next(err)
  }
}
