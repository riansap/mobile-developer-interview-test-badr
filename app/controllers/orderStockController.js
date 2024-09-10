import Sequelize, { Op } from 'sequelize'
import moment from 'moment'
import models from '../models'
import { ORDER_STATUS, ORDER_TYPE } from '../helpers/constants'

const { Material } = models

export async function list (req, res, next) {
  try {
    const {
      vendor_id,
      customer_id,
      external_entity_id,
      material_tag_id,
      material_id,
      transaction_type_id,
      is_distribution,
      is_received,
      province_id,
      regency_id,
      sub_district_id,
      material_ids,
      order_types,
      is_vaccine
    } = req.query
    let { from, to } = req.query
    const whereOrder = {}
    const whereOrderStock = {}
    const whereMaterial = {}
    const whereTransaction = {}
    let whereEntity = {}

    if (province_id) {
      whereEntity = {
        where: {
          province_id
        },
        required: true
      }
    } else if (regency_id) {
      whereEntity = {
        where: {
          regency_id
        },
        required: true
      }
    } else if (sub_district_id) {
      whereEntity = {
        where: {
          sub_district_id
        },
        required: true
      }
    }

    if (transaction_type_id) {
      whereTransaction.transaction_type_id = transaction_type_id
    }

    if (material_id) {
      whereMaterial.id = material_id
    } else if (material_ids) {
      let materialIds = String(material_ids).split(',')
      materialIds = materialIds.map(item => Number(String(item).trim()))
      whereMaterial.id = materialIds
    }

    if (is_vaccine) {
      let isVaccine = String(is_vaccine).split(',')
      whereMaterial.is_vaccine = isVaccine
    }

    if (material_tag_id) {
      const materials = await Material.findAll({
        where: whereMaterial,
        include: {
          association: 'material_tags',
          required: true,
          where: { id: material_tag_id }
        },
        attributes: ['id']
      })
      const materialIds = materials.map(item => item.id)
      whereMaterial.id = materialIds
    }

    if (from && to) {
      from = moment(from).format('YYYY-MM-DD').toString()
      to = moment(to).format('YYYY-MM-DD').toString()

      from = `${from}T00:00:00.000Z`
      to = `${to}T23:59:59.000Z`
      whereOrderStock.updated_at = {
        [Op.between]: [from, to]
      }
    } else if (from) {
      from = moment(from).format('YYYY-MM-DD').toString()
      from = `${from}T00:00:00.000Z`
      whereOrderStock.updated_at = {
        [Op.gte]: from
      }
    } else if (to) {
      to = moment(to).format('YYYY-MM-DD').toString()
      to = `${to}T23:59:59.000Z`
      whereOrderStock.updated_at = {
        [Op.lte]: to
      }
    }

    if (vendor_id) whereOrder.vendor_id = vendor_id
    if (customer_id) whereOrder.customer_id = customer_id

    if (external_entity_id && vendor_id) {
      whereOrder.vendor_id = [vendor_id, external_entity_id]
    } else if (external_entity_id && customer_id) {
      whereOrder.customer_id = [customer_id, external_entity_id]
    }

    if (is_distribution) {
      whereOrder[Op.or] = [
        { status: ORDER_STATUS.SHIPPED },
        { status: ORDER_STATUS.FULFILLED },
      ]
    } else if (is_received) {
      whereOrder.status = ORDER_STATUS.FULFILLED
    }

    if (order_types) {
      let orderTypes = String(order_types).split(',')
      orderTypes = orderTypes.map(item => Number(String(item).trim()))
      whereOrder.type = orderTypes
    }

    req.include = [
      {
        association: 'stock',
        include: [
          {
            association: 'batch',
            attributes: ['id', 'code', 'expired_date']
          }
        ],
        required: true,
      },
      {
        association: 'order_item',
        required: true,
        include: [
          {
            association: 'order',
            required: true,
            where: {
              type: {
                [Op.ne]: ORDER_TYPE.RETURN
              },
              ...whereOrder,
            },
            include: [
              {
                association: 'customer',
                attributes: ['id', 'name'],
                required: true
              },
              {
                association: 'vendor',
                attributes: ['id', 'name'],
                required: true,
                ...whereEntity
              }
            ]
          },
          {
            association: 'material',
            attributes: ['id', 'name', 'description'],
            required: true,
            where: whereMaterial
          }
        ]
      }
    ]

    req.condition = whereOrderStock
    /**
     * attributes yang di present
     * pelanggan/vendor = customer.name
     * tanggal transaksi = createdAt
     * material = material.description
     * no batch = stock.batch.code
     * batch kadaluwarsa = stock.batch.expired_date
     * stok pembuka = opening_qty
     * kuantitas = change_qty
     * stok penutup = closing_qty
    * */

    let colGroup = [Sequelize.col('order_item.order.vendor.id'), 'asc']
    if (vendor_id) colGroup = [Sequelize.col('order_item.order.customer.id'), 'asc']

    req.order = [
      colGroup,
      ['updated_at', 'desc']
    ]
    req.mappingDocs = ({ docs }) => {
      let result = []

      docs.forEach(order_stock => {
        let {
          order_item,
          stock,
          created_at,
          allocated_qty,
          ordered_qty,
          received_qty
        } = order_stock
        let { batch } = stock
        let { material, order } = order_item
        let { customer, vendor } = order

        result.push({
          order_stock_id: order_stock.id,
          allocated_qty,
          received_qty,
          ordered_qty,
          created_at,
          customer,
          vendor,
          material,
          batch
        })
      })

      return result
    }
    return next()
  } catch (err) {
    return next(err)
  }
}
