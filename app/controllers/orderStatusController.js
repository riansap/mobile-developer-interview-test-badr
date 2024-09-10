import { Op } from 'sequelize'
import * as orderController from './orderController'
import models from '../models'
import moment from 'moment'
import { publishWorker } from '../helpers/services/rabbitmqHelper'
import { formatUpdatePayload } from '../helpers/integrations/covidIntegrationHelper'
import { ORDER_STATUS, ORDER_TYPE, TRANSACTION_TYPE } from '../helpers/constants'
import { formatCreateEasyGoPayload } from '../helpers/integrations/easyGoHelper'
import { generateOrderNotification } from '../helpers/notifications/orderNotification'
import { orderDetailFromDB } from './v2/order/orderNormalController'

export function setStatus(status = null) {
  return async (req, res, next) => {
    try {
      if (!status) throw { status: 500, message: 'Error data' }
      req.body.status = status
      return next()
    } catch (err) {
      return next(err)
    }
  }
}

export async function updateStatus(req, res, next) {
  try {
    const t = await models.sequelize.transaction()
    const authUser = req.user
    const { id } = req.params
    const {
      comment, sales_ref, estimated_date, status,
      cancel_reason, taken_by_customer, other_reason, track_device,
      order_items,
    } = req.body

    // lock with transaction
    let order = await models.Order.findByPk(id, {
      transaction: t,
    })

    // start transaction
    try {
      let updateField = {
        cancel_reason: cancel_reason,
        estimated_date: estimated_date,
        sales_ref: sales_ref,
        status: status,
        taken_by_customer: taken_by_customer,
        other_reason: other_reason,
        updated_by: req.user?.id || null
      }

      if (status === ORDER_STATUS.SHIPPED) updateField.track_device_id = track_device?.id || null

      let orderStatusUser = {
        'confirmed': ORDER_STATUS.CONFIRMED,
        'shipped': ORDER_STATUS.SHIPPED,
        'fulfilled': ORDER_STATUS.FULFILLED,
        'cancelled': ORDER_STATUS.CANCELED
      }

      for (const key in orderStatusUser) {
        if (orderStatusUser[key] === updateField.status) {
          updateField[`${key}_by`] = req.user?.id || null
          updateField[`${key}_at`] = req.body[`${key}_at`] || Date.now()
        }
      }

      const shipOrder = {
        order: order,
        authUser: authUser
      }

      if (updateField.status === ORDER_STATUS.CANCELED || updateField.status === ORDER_STATUS.PENDING) {
        // Rollback Shipment
        const doRollbackStock = true
        if (order.status === ORDER_STATUS.SHIPPED) await shipStock(shipOrder, t, doRollbackStock)
        if (order.status === ORDER_STATUS.ALLOCATED) await rollbackAllocate(order, t)
      }

      await order.update(updateField, { transaction: t })

      if (comment) {
        await orderController.createComment({
          order_id: order.id,
          comment: comment,
          user: authUser,
          status: status
        }, t)
      }

      if (order.status === ORDER_STATUS.SHIPPED) await shipStock(shipOrder, t)
      else if (order.status === ORDER_STATUS.CONFIRMED) {
        await confirmOrder({ order, order_items, t })
      } else if (order.status === ORDER_STATUS.FULFILLED) {
        const { order_items } = req.body
        await fulfillStock({
          order: order,
          order_items: order_items,
          authUser: authUser
        }, t)
      } else if (order.status === ORDER_STATUS.PENDING) {
        // if back to pending, rollback order item projection
        const lastDataNotConfirm = await models.OrderItemProjectionCapacity.findOne({
          attributes: ['id', 'order_id'],
          where: { is_confirm: false, order_id: order.id },
          order: [['updated_at', 'DESC']],
          transaction: t
        })
        
        if (lastDataNotConfirm) {
          await models.OrderItemProjectionCapacity.destroy({
            where: { order_id: order.id, id: { [Op.ne]: lastDataNotConfirm.id } },
            transaction: t
          })
        }
      }
      await t.commit()

    } catch (err) {
      await t.rollback()
      return next(err)
    }

    // after created transaction & process to third party, etc
    order = await models.Order.findByPk(id, {
      include: {
        association: 'activity',
        attributes: ['id', 'name'],
      }
    })

    const token = req.headers.authorization.split(' ')[1]
    if (track_device && order.status === ORDER_STATUS.SHIPPED) {
      // send to tracking third party
      let callbackHost = req.get('host')
      let easyGoCreate = formatCreateEasyGoPayload(order, track_device.nopol, token, callbackHost)
      publishWorker('http-worker', easyGoCreate)
    }

    if(order.status === ORDER_STATUS.SHIPPED) {
      generateOrderNotification(order)
    }

    return res.status(200).json(order)
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

async function confirmOrder({ order, order_items, t }) {
  return new Promise(async (resolve, reject) => {
    try {
      const queries = []
      for (let i = 0; i < order_items.length; i++) {
        let item = order_items[i]
        await models.OrderItem.update(
          { confirmed_qty: item.confirmed_qty },
          { where: { id: item.id, order_id: order.id } },
          { transaction: t }
        )
      }
      return resolve('done')
    } catch (err) {
      console.error(err)
      return reject(err)
    }
  })
}

async function shipStock(shipOrder, t, doRollbackStock = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const { order, authUser } = shipOrder
      // loop order_items
      let orderItemIds = order.order_items.map(item => item.id)
      let orderStocks = await models.OrderStock.findAll({
        where: {
          order_item_id: {
            [Op.in]: orderItemIds
          }
        }
      })
      if (!orderStocks.length) {
        throw 'Allocated Stock is null'
      }
      let stockIds = orderStocks.map((order_stocks) => {
        return order_stocks.stock_id
      })
      let stocks = await models.Stock.findAll({
        where: {
          id:
            { [Op.in]: stockIds }
        },
        lock: {
          level: true,
          of: models.Stock
        },
        include: { association: 'material_entity', attributes: ['material_id', 'entity_id'] },
        transaction: t,
      })

      let transactions = []
      for (let i = 0; i < orderStocks.length; i++) {
        let vendorStock = stocks.filter((stock) => stock.id === orderStocks[i].stock_id)
        if (vendorStock.length) vendorStock = vendorStock[0]
        if (!vendorStock) {
          throw 'Stok tidak ditemukan'
        }

        let getDuplicateIssues = await models.Transaction.findAll({
          where: {
            stock_id: orderStocks[i].stock_id,
            order_id: order.id,
            transaction_type_id: TRANSACTION_TYPE.ISSUES
          }
        }, { transaction: t })

        if (!doRollbackStock && getDuplicateIssues.length > 0) {
          console.log('[throw] pengeluaran dobel dengan order = [' + order.id + '] dan order stock id = [' + orderStocks[i].id + ']')
          throw 'Pengeluaran dobel'
        }

        if (!doRollbackStock && vendorStock.allocated <= 0) {
          console.log('[throw] alokasi <= 0 dengan order = [' + order.id + '] dan order stock id = [' + orderStocks[i].id + ']')
          throw 'Alokasi tidak boleh lebih kecil dari 0'
        }

        let allocatedQty = orderStocks[i].allocated_qty
        if (!doRollbackStock) allocatedQty = -Math.abs(allocatedQty)

        let updateStock = {
          qty: vendorStock.qty + allocatedQty,
          updated_by: authUser.id
        }
        if (!doRollbackStock) updateStock.allocated = vendorStock.allocated + allocatedQty

        if (allocatedQty) {
          transactions.push(transactionFormatBulk(
            {
              stock: vendorStock,
              transaction_type_id: doRollbackStock ? TRANSACTION_TYPE.RECEIPTS : TRANSACTION_TYPE.ISSUES,
              change_qty: allocatedQty,
              user_id: authUser.id || null,
              customer_id: order.customer_id,
              vendor_id: order.vendor_id,
              material_entity: vendorStock.material_entity,
              order_id: order.id
            }
          ))
        }

        await vendorStock.update(updateStock, { transaction: t })
      }

      await models.Transaction.bulkCreate(transactions, { transaction: t })

      resolve('done')
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}

async function rollbackAllocate(order, t) {
  return new Promise(async (resolve, reject) => {
    try {
      for (let i = 0; i < order.order_items.length; i++) {
        let item = order.order_items[i]
        let orderStocks = await models.OrderStock.findAll({ where: { order_item_id: item.id } })
        for (let j = 0; j < orderStocks.length; j++) {
          let currentStock = await models.Stock.findOne({
            where: { id: orderStocks[j].stock_id },
            lock: {
              level: true,
              of: models.Stock
            },
            transaction: t,
          })
          await currentStock.update({ allocated: currentStock.allocated - orderStocks[j].allocated_qty }, { transaction: t })
          await orderStocks[j].update({ allocated_qty: 0 }, { transaction: t })
        }
      }
      resolve('done')
    } catch (err) {
      reject(err)
      // throw {status: 400, message: err}
    }
  })
}

async function fulfillStock(fulfillOrder, t) {
  return new Promise(async (resolve, reject) => {
    try {
      const { order, order_items, authUser } = fulfillOrder

      let orderStockIds = []
      order_items.map(item =>
        item.order_stocks.map((stock) => {
          orderStockIds.push(stock.id)
        })
      )
      let orderStocks = await models.OrderStock.findAll({
        where: {
          id: {
            [Op.in]: orderStockIds
          }
        },
        include: [
          { association: 'stock', include: { association: 'batch' } },
        ]
      })
      for (let p = 0; p < order_items.length; p++) {
        let material = order_items[p]
        let materialEntityField = {
          material_id: material.material_id, entity_id: order.customer_id
        }

        let materialEntity = await models.MaterialEntity.findOne({
          where: [materialEntityField]
        }).then(function (model) {
          if (!model) model = models.MaterialEntity.create({
            ...materialEntityField,
            created_by: authUser.id,
            updated_by: authUser.id
          })
          return model
        })

        for (let j = 0; j < material.order_stocks.length; j++) {
          let { id, received_qty, status, fulfill_reason, other_reason, qrcode } = material.order_stocks[j]
          received_qty = parseInt(received_qty)
          let orderStock = orderStocks.find(stock => stock.id === id)
          let batchId = null
          if (orderStock && orderStock.stock && orderStock.stock.batch_id) batchId = orderStock.stock.batch_id

          let getDuplicateReceipts = await models.Transaction.findAll({
            where: {
              stock_id: orderStock.stock_id,
              order_id: order.id,
              transaction_type_id: TRANSACTION_TYPE.RECEIPTS
            }
          }, { transaction: t })

          if (getDuplicateReceipts.length > 0) {
            console.log('[throw] penerimaan dobel dengan order = [' + order.id + '] dan order stock id = [' + orderStock.id + ']')
            throw 'Penerimaan dobel'
          }

          let stockField = { material_entity_id: materialEntity.id, batch_id: batchId }
          let stockCustomer = await models.Stock.findOne({
            where: stockField,
            include: { association: 'material_entity', attributes: ['material_id', 'entity_id'] },
            lock: {
              level: true,
              of: models.Stock
            },
            transaction: t,
          }).then(function (model) {
            if (!model) model = models.Stock.create({
              ...stockField,
              qty: 0,
              created_by: authUser.id,
              updated_by: authUser.id
            }, { transaction: t })
            return model
          })

          let getDuplicateReceiptsCust = await models.Transaction.findAll({
            where: {
              stock_id: stockCustomer.id,
              order_id: order.id,
              transaction_type_id: TRANSACTION_TYPE.RECEIPTS
            }
          }, { transaction: t })

          if (getDuplicateReceiptsCust.length > 0) {
            console.log('[throw] penerimaan dobel dengan order = [' + order.id + '] dan  stock customer id = [' + stockCustomer.id + ']')
            throw 'Penerimaan dobel'
          }
          await createTransaction({
            stock: stockCustomer,
            transaction_type_id: TRANSACTION_TYPE.RECEIPTS,
            change_qty: received_qty,
            user_id: authUser?.id || null,
            customer_id: order.customer_id,
            vendor_id: order.vendor_id,
            material_entity: materialEntity,
            order_id: order.id
          }, t)

          await stockCustomer.update({
            qty: stockCustomer.qty + received_qty,
            updated_by: authUser.id,
            status: status
          }, { transaction: t })

          await orderStock.update({
            received_qty: received_qty,
            updated_by: authUser.id,
            fulfill_reason: fulfill_reason,
            fulfill_status: status,
            other_reason: other_reason,
            qrcode: qrcode
          }, { transaction: t })
        }
      }
      // send data to PUSATDATA
      // get data order from PUSATDATA
      resolve('done')
    } catch (err) {
      reject(err)
    }
  })
}

function transactionFormatBulk(transaction) {
  const { stock, transaction_type_id, change_qty = 0, user_id, vendor_id = null, customer_id = null, material_entity, order_id = null } = transaction
  return {
    stock_id: stock.id,
    transaction_type_id: transaction_type_id,
    opening_qty: stock.qty,
    change_qty: change_qty,
    created_by: user_id,
    updated_by: user_id,
    entity_id: material_entity.entity_id,
    material_id: material_entity.material_id,
    customer_id: customer_id,
    vendor_id: vendor_id,
    order_id: order_id
  }
}

async function createTransaction(transaction, t) {
  return new Promise(async (resolve, reject) => {
    try {
      const { stock, transaction_type_id, change_qty = 0, user_id, vendor_id = null, customer_id = null, material_entity, order_id = null } = transaction
      await models.Transaction.create({
        stock_id: stock.id,
        transaction_type_id: transaction_type_id,
        opening_qty: stock.qty,
        change_qty: change_qty,
        created_by: user_id,
        updated_by: user_id,
        entity_id: material_entity.entity_id,
        material_id: material_entity.material_id,
        customer_id: customer_id,
        vendor_id: vendor_id,
        order_id: order_id
      }, { transaction: t })

      resolve('done')
    } catch (err) {
      // throw Error(err)
      reject(err)
    }
  })
}

export async function allocateStock(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const { params, user } = req
    const { id } = params
    let order = await models.Order.findByPk(id, {transaction: t})
    let orderItemId = order.order_items.map(item => item.id)

    if (orderItemId.length > 0)
      await models.OrderStock.destroy({
        where: {
          order_item_id: {
            [Op.in]: orderItemId
          }
        }
      }, { transaction: t })

    let items = req.body
    for (let item of items) {
      if (item.order_item_kfa_id && item.material_id) {
        const newOrderItem = {
          master_material_id: item.material_id,
          qty: item.allocated_qty,
          confirmed_qty: item.allocated_qty,
          order_id: id,
          created_by: user.id,
          updated_by: user.id,
          order_item_kfa_id: item.order_item_kfa_id
        }

        const orderItem = await models.OrderItem.create(newOrderItem, { transaction: t })

        item.order_item_id = orderItem.id
      }
    }


    let orderStocks = req.body.map(item => {
      return {
        order_item_id: item.order_item_id,
        allocated_qty: parseInt(item.allocated_qty),
        stock_id: item.allocated_stock_id,
        status: item.status
      }
    }).filter((item) => item.allocated_qty > 0)

    await models.OrderStock.bulkCreate(orderStocks, { transaction: t })
    for (let j = 0; j < orderStocks.length; j++) {
      let item = orderStocks[j]
      let allocatedStock = await models.Stock.findByPk(item.stock_id, {
        lock: {
          level: true,
          of: models.Stock
        },
        transaction: t
      })
      await allocatedStock.update({ allocated: item.allocated_qty + allocatedStock.allocated }, { transaction: t })
    }

    await order.update({
      is_allocated: 1,
      status: ORDER_STATUS.ALLOCATED,
      updated_by: req.user.id,
      allocated_at: Date.now(),
      allocated_by: req.user.id
    }, { transaction: t })

    await t.commit()

    if (process.env.APP_SERVICE == 'logistic')
      order = await orderDetailFromDB(id, req)
    else
      order = await models.Order.findByPk(id)
    return res.status(200).json(order)
  } catch (err) {
    await t.rollback()
    console.error(err)
    next(err)
  }
}

export async function listStatus(req, res, next) {
  try {
    const data = []
    let { type = `${ORDER_TYPE.NORMAL}`, purpose, ordered_number,
      purchase_ref, sales_ref, vendorId, customerId, to_date,
      from_date, tags
    } = req.query
    let entityID = req.entityID
    var status = JSON.parse(JSON.stringify(ORDER_STATUS))
    let orderCondition = []
    if (type) {
      type = type.split(',')
      orderCondition.push({ type: { [Op.in]: type } })
    }

    if (purpose === 'sales') {
      orderCondition.push({ vendor_id: entityID })
    } else {
      orderCondition.push({ customer_id: entityID })
    }
    if (vendorId) orderCondition.push({ vendor_id: vendorId })
    if (customerId) orderCondition.push({ customer_id: customerId })
    if (ordered_number) orderCondition.push({ id: Number(ordered_number) })
    if (purchase_ref) orderCondition.push({ purchase_ref: purchase_ref })
    if (sales_ref) orderCondition.push({ sales_ref: sales_ref })
    if (from_date) {
      orderCondition.push({
        created_at: {
          [Op.gte]: moment(from_date).toDate()
        }
      })
    } else if (to_date) {
      orderCondition.push({
        created_at: {
          [Op.lte]: moment(to_date).toDate()
        }
      })
    }
    let tagsInclude = []
    if (tags && !Array.isArray(tags)) tags = JSON.parse(tags)
    if (Array.isArray(tags) && tags.length > 0) {
      tagsInclude.push({
        model: models.OrderTag,
        as: 'order_tags',
        attributes: ['id', 'title'],
        through: { attributes: [] },
        where: {
          id: {
            [Op.in]: tags
          }
        },
        required: true,
      })
    }

    if (type.includes(ORDER_TYPE.DROPPING)) {
      delete status.PENDING
      delete status.CANCELED
    }

    let orderAll = await models.Order.count({
      where: orderCondition,
      attributes: ['id', 'status', 'customer_id'],
      without_relations: true,
      include: tagsInclude
    })

    data.push({
      id: null,
      title: 'ALL',
      total: orderAll || 0
    })

    for (let item of Object.keys(status)) {
      let orderPerStatus = await models.Order.count({
        where: [
          ...orderCondition,
          { status: status[item] }
        ],
        attributes: ['id', 'status', 'customer_id'],
        without_relations: true,
        include: tagsInclude
      })
      data.push({
        id: status[item],
        title: item,
        total: orderPerStatus || 0
      })
    }

    return res.status(200).json({ list: data })
  } catch (err) {
    return next(err)
  }
}

export async function updateKPCPEN(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const { id } = req.params
    let order = await models.Order.findByPk(id)
    if (!order) throw { status: 404, message: req.__('404') }
    if (order.submit_kpcpen_at) throw { status: 422, message: 'Order already submitted at KPCPEN' }
    await order.update({ submit_kpcpen_at: new Date() })

    await t.commit()
    return res.status(200).json({ message: 'success' })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function updateNoDO(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const { id } = req.params
    const { easygo_no_do } = req.body
    let order = await models.Order.findByPk(id)
    if (!order) throw { status: 404, message: req.__('404') }
    if (order.status === ORDER_STATUS.FULFILLED) throw { status: 422, message: 'Order has fulfill' }
    if (order.easygo_no_do) throw { status: 422, message: 'Order already has No DO' }
    await order.update({ easygo_no_do: easygo_no_do })

    await t.commit()
    return res.status(200).json({ message: 'success' })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function syncPostKpcpen(req, res, next) {
  try {
    let { order_ids } = req.body
    let condition = [{
      type: ORDER_TYPE.DROPPING,
      submit_kpcpen_at: null,
      status: 5
    }]
    if (order_ids && Array.isArray(order_ids)) {
      condition.push({ id: { [Op.in]: order_ids } })
    }

    const token = req.headers.authorization.split(' ')[1]
    let orders = await models.Order.findAll(({ where: condition }))
    for (let i = 0; i < orders.length; i++) {
      let order = orders[i]
      const payloadUpdate = formatUpdatePayload(order, token, '')
      await publishWorker('covid-api-update', payloadUpdate)
    }
    return res.status(200).json({ message: 'success' })

  } catch (error) {
    return next(error)
  }
}
