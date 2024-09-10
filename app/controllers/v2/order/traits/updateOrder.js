/* eslint-disable no-case-declarations */
import { Op, QueryTypes } from 'sequelize'

import models from '../../../../models'

import { ORDER_STATUS, TRANSACTION_TYPE } from '../../../../helpers/constants'

import { createColdStorage } from '../../../coldstorageController'
import { changeStatusSSL } from '../../../../helpers/integrations/satuSehatSSL'
import { saveOrderItemProjectionCapacity } from '../orderNormalController'

const { sequelize } = models

export async function updateOrder({ order, body, t, req }) {
  let result = null
  const user = req.user
  const { order_items } = body
  switch (order.status) {
    case ORDER_STATUS.CONFIRMED:
      if (user) {
        body = {
          ...body,
          created_by: user.id,
          updated_by: user.id,
        }
      }
      await confirmOrder({ body, order, order_items, t })
      break
    case ORDER_STATUS.SHIPPED:
      await shipOrder({ order, t, doRollbackStock: false, req })
      break
    case ORDER_STATUS.CANCELED:
    case ORDER_STATUS.PENDING:
      const prevStatus = order.previous('status')
      if (prevStatus === ORDER_STATUS.SHIPPED) await shipOrder({ order, t, doRollbackStock: true, req })
      if (prevStatus === ORDER_STATUS.ALLOCATED) await rollbackAllocate(order, t)
      break
    case ORDER_STATUS.FULFILLED:
      result = await fulfillOrder({
        order,
        order_items
      }, t, req)
      break
    default:
      break
  }
  return result
}

export function transactionFormatBulk(transaction) {
  const { stock, transaction_type_id, change_qty = 0,
    user_id, entity_master_material, order } = transaction
  return {
    stock_id: stock.id,
    transaction_type_id,
    opening_qty: stock.qty,
    change_qty,
    created_by: user_id,
    updated_by: user_id,
    entity_id: entity_master_material.entity_id,
    master_material_id: entity_master_material.master_material_id,
    activity_id: order.activity_id,
    customer_id: order.customer_id,
    vendor_id: order.vendor_id,
    order_id: order.id
  }
}

async function confirmOrder({ body, order, order_items, t }) {
  try {
    const materialQtyJSON = {}
    const masterMaterialId = []

    for (let i = 0; i < order_items.length; i++) {
      let item = order_items[i]
      if (process.env.APP_SERVICE === 'logistic') {
        let { children = [] } = item

        if (item.id) {
          const orderItemKfa = await models.OrderItemKfa.findByPk(item.id, { transaction: t })
          if (orderItemKfa) {
            orderItemKfa.qty = item.qty
            orderItemKfa.confirmed_qty = item.confirmed_qty
            await orderItemKfa.save({ transaction: t })
          }
        }

        for (let child of children) {
          const orderItem = await models.OrderItem.findByPk(child.id, { transaction: t })
          if (orderItem) {
            orderItem.qty = child.qty
            orderItem.confirmed_qty = child.confirmed_qty

            await orderItem.save({ transaction: t })
          }
        }

      } else {
        const orderItem = await models.OrderItem.findByPk(item.id, { transaction: t })
        orderItem.qty = item.qty
        orderItem.confirmed_qty = item.confirmed_qty
        await orderItem.save({ transaction: t })
        materialQtyJSON[Number(item.material_id)] = Number(item.confirmed_qty)
        masterMaterialId.push(item.material_id)
      }
    }
    if (process.env.APP_SERVICE !== 'logistic') {
      await saveOrderItemProjectionCapacity({
        body, order, orderItems: order_items, masterMaterialId, materialQtyJSON, transaction: t, isCreate: true, isConfirm: true
      })
    }
  } catch (err) {
    console.error(err)
    throw err
  }
}


async function batchActivated({ id, t }) {
  const batch = await models.Batch.findByPk(id)
  if (batch) batch.update({ status: 1 }, { transaction: t })
}

async function shipOrder({ order, t, doRollbackStock = false, req }) {
  try {
    const { shipped_by } = order
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
    let stockIds = orderStocks.map((order_stocks) => order_stocks.stock_id)
    let stocks = await models.Stock.findAll({
      where: {
        id:
          { [Op.in]: stockIds }
      },
      lock: {
        level: true,
        of: models.Stock
      },
      include: { association: 'entity_master_material', attributes: ['master_material_id', 'entity_id'] },
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
        updated_by: shipped_by
      }
      if (!doRollbackStock) updateStock.allocated = vendorStock.allocated + allocatedQty

      if (allocatedQty) {
        /* trigger to coldstorage */
        const { entity_id, master_material_id } = vendorStock.entity_master_material
        await triggerColdstorage(entity_id, master_material_id, t, req)
        /* end trigger to coldstorage */
        transactions.push(transactionFormatBulk(
          {
            stock: vendorStock,
            transaction_type_id: doRollbackStock ? TRANSACTION_TYPE.RECEIPTS : TRANSACTION_TYPE.ISSUES,
            change_qty: allocatedQty,
            user_id: shipped_by || null,
            entity_master_material: vendorStock.entity_master_material,
            order
          }
        ))
      }

      await vendorStock.update(updateStock, { transaction: t })

      //activate batch
      await batchActivated({ id: vendorStock?.batch_id, t })
    }

    await models.Transaction.bulkCreate(transactions, { transaction: t })

    // update updatedAt on previous transaction
    //let updatedAt = moment().format('YYYY-MM-DD HH:mm:ss')

    await sequelize.query(`
      UPDATE transactions set updatedAt = NOW() WHERE order_id = :id AND transaction_type_id in (:type_id)
    `, {
      replacements: { id: order.id, type_id: [TRANSACTION_TYPE.RECEIPTS, TRANSACTION_TYPE.ISSUES] },
      type: QueryTypes.UPDATE,
      transaction: t
    })

    if (doRollbackStock) await changeStatusSSL(order.id, ORDER_STATUS.CANCELED)

  } catch (err) {
    console.error(err)
    throw err
  }
}

async function findOrCreateEntityMasterMaterial({ master_material_id, entity_id, user_id, activity_id = null, t }) {
  const materialCustomerField = {
    master_material_id,
    entity_id
  }
  var entityMasterMaterial = await models.EntityMasterMaterial.findOne({
    where: materialCustomerField,
    transaction: t,
  })
  if (!entityMasterMaterial) {
    entityMasterMaterial = await models.EntityMasterMaterial.create({
      ...materialCustomerField,
      created_by: user_id,
      updated_by: user_id,
    }, { transaction: t })
  }

  if (activity_id) {
    var entityActivityField = {
      entity_master_material_id: entityMasterMaterial.id,
      activity_id: activity_id
    }
    var entityMasterMaterialActivities = await models.EntityMasterMaterialActivities.findOne({
      where: entityActivityField,
      transaction: t,
    })

    if (!entityMasterMaterialActivities) {
      await models.EntityMasterMaterialActivities.create({
        ...entityActivityField,
        created_by: user_id,
        updated_by: user_id,
      }, { transaction: t })
    }
  }

  return entityMasterMaterial
}

async function fulfillOrder(fulfillOrder, t, req) {
  try {
    let { order, order_items } = fulfillOrder
    const { fulfilled_by, activity_id } = order
    let triggerColdstorageData = []


    if (process.env.APP_SERVICE === 'logistic') {
      let data_order_items = []
      order_items.forEach(item => {
        const { children = [] } = item
        children.forEach(orderItem => data_order_items.push(orderItem))
      })

      order_items = [...data_order_items]
    }

    let orderStockIds = []
    order_items.forEach(item =>
      item.order_stock_fulfill.forEach((stockFulfill) => {
        orderStockIds = [
          ...orderStockIds,
          ...stockFulfill.order_stock_ids
        ]
      })
    )


    for (let p = 0; p < order_items.length; p++) {
      const orderItem = order_items[p]
      let materialCustomer = await findOrCreateEntityMasterMaterial({
        master_material_id: orderItem.material_id,
        entity_id: order.customer_id,
        user_id: fulfilled_by,
        activity_id,
        t,
      })

      let materialVendor = await models.EntityMasterMaterial.findOne({
        where: {
          master_material_id: orderItem.material_id,
          entity_id: order.vendor_id
        }
      })

      for (let j = 0; j < orderItem.order_stock_fulfill.length; j++) {
        let { batch_id = null, received_qty, status, fulfill_reason, other_reason, qrcode } = orderItem.order_stock_fulfill[j]
        received_qty = parseInt(received_qty)

        let stockField = {
          entity_has_material_id: materialCustomer.id,
          activity_id,
          batch_id
        }
        let stockCustomer = await models.Stock.findOne({
          where: stockField,
          include: { association: 'material_entity', attributes: ['material_id', 'entity_id'] },
          lock: {
            level: true,
            of: models.Stock
          },
          transaction: t,
        })

        let stockVendor = await models.Stock.findOne({
          attributes: ['year', 'price', 'total_price', 'budget_source'],
          where: { entity_has_material_id: materialVendor.id, activity_id, batch_id }
        })


        if (stockVendor) {
          stockField.year = stockVendor.year
          stockField.price = stockVendor.price
          stockField.total_price = stockVendor.total_price
          stockField.budget_source = stockVendor.budget_source
        }


        if (!stockCustomer) {
          stockCustomer = await models.Stock.create({
            ...stockField,
            qty: 0,
            created_by: fulfilled_by,
            updated_by: fulfilled_by
          }, { transaction: t })
        }

        let getDuplicateReceipts = await models.Transaction.findAll({
          where: {
            stock_id: stockCustomer.id,
            order_id: order.id,
            transaction_type_id: TRANSACTION_TYPE.RECEIPTS
          }
        }, { transaction: t })

        if (getDuplicateReceipts.length > 0) {
          console.log('[throw] penerimaan dobel dengan order = [' + order.id + '] dan  stock customer id = [' + stockCustomer.id + ']')
          throw 'Penerimaan dobel'
        }

        let receiveTrx = transactionFormatBulk({
          stock: stockCustomer,
          transaction_type_id: TRANSACTION_TYPE.RECEIPTS,
          change_qty: received_qty,
          user_id: fulfilled_by || null,
          entity_master_material: materialCustomer,
          order
        })

        const transaction = await models.Transaction.create(receiveTrx, { transaction: t })

        await stockCustomer.update({
          ...stockField,
          qty: stockCustomer.qty + received_qty,
          updated_by: fulfilled_by,
          status: status
        }, { transaction: t })

        await batchActivated({ id: stockField?.batch_id, t })

        if (stockField.year && stockField.price && stockField.budget_source) {
          await models.TransactionPurchase.create({
            transaction_id: transaction.id,
            source_material_id: stockField.budget_source,
            year: stockField.year,
            price: stockField.price,
            total_price: received_qty * stockField.price
          }, { transaction: t })
        }

        await models.OrderStock.update({
          received_qty: models.Sequelize.literal('allocated_qty'),
          updated_by: fulfilled_by,
          fulfill_reason: fulfill_reason,
          fulfill_status: status,
          other_reason: other_reason,
          qrcode: qrcode
        }, {
          where: {
            id: { [Op.in]: orderStockIds }
          }
        }, { transaction: t })
      }

      /* trigger coldstorage */


      const { entity_id, master_material_id } = materialCustomer
      triggerColdstorageData.push({ entity_id, master_material_id, t, req })
      // await triggerColdstorage(entity_id, master_material_id, t, req)
    }

    // update updatedAt on previous transaction
    //let updatedAt = moment().format('YYYY-MM-DD HH:mm:ss')

    await sequelize.query(`
      UPDATE transactions set updatedAt = NOW() WHERE order_id = :id AND transaction_type_id = :type_id
    `, {
      replacements: { id: order.id, type_id: TRANSACTION_TYPE.ISSUES },
      type: QueryTypes.UPDATE,
      transaction: t
    })

    await changeStatusSSL(order.id, ORDER_STATUS.FULFILLED)
    return triggerColdstorageData
  } catch (err) {
    console.error(err)
    throw err
  }
}

async function rollbackAllocate(order, t) {
  try {
    if (!order.order_items) throw 'Error'
    let { order_items } = order

    for (let i = 0; i < order_items.length; i++) {
      let item = order_items[i]
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
        //await currentStock.update({qty: currentStock.qty - orderStocks[j].allocated_qty}, {transaction: t})
        await orderStocks[j].update({ allocated_qty: 0 }, { transaction: t })
      }
    }
  } catch (err) {
    throw err
  }
}


export async function triggerColdstorage(entity_id, master_material_id, t, req) {
  await models.ColdstorageTransactionLog.create({
    entity_id, master_material_id, status: 0
  }, { transaction: t })

  createColdStorage(entity_id, master_material_id, req)
}