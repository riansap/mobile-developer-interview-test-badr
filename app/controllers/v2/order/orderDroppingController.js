import _ from 'lodash'

import {
  ORDER_TYPE, ORDER_STATUS, DEVICE_TYPE, USER_ROLE, TRANSACTION_TYPE
} from '../../../helpers/constants'

import models from '../../../models'
import { generateOrderNotification } from '../../../helpers/notifications/orderNotification'
import { transaction } from '../../migrationController'

export async function create(req, res, next) {
  const device_type = DEVICE_TYPE[req.headers['device-type']]
  const { user } = req
  let vendorId
  let customerId

  const customer = await models.Entity.findOne({
    where: { code: req.body.customer_code },
  })

  customerId = customer.id
  if (user.role === USER_ROLE.SUPERADMIN) {
    var vendor_code = ''
    if (req.body.vendor_code)
      vendor_code = req.body.vendor_code
    else {
      const { entity } = req.user
      vendor_code = entity.code
    }
    const vendor = await models.Entity.findOne({
      where: { code: vendor_code },
    })
    vendorId = vendor.id
  } else {
    vendorId = req.user.entity_id
  }
  const {
    order_items: orderItems,
    is_allocated, type,
    order_comment: orderComment,
  } = req.body

  if (parseInt(type) === ORDER_TYPE.RETURN) {
    req.body.type = ORDER_TYPE.RETURN
  } else if (parseInt(type) === ORDER_TYPE.NORMAL) {
    req.body.type = ORDER_TYPE.NORMAL
  } else {
    req.body.type = ORDER_TYPE.DROPPING
  }

  req.body = {
    ...req.body,
    status: ORDER_STATUS.SHIPPED,
    customer_id: customerId,
    vendor_id: vendorId,
    confirmed_by: user.id,
    allocated_by: user.id,
    shipped_by: user.id,
    confirmed_at: new Date(),
    allocated_at: new Date(),
    shipped_at: new Date(),
    device_type,
    created_by: user.id,
    updated_by: user.id,
  }
  if (is_allocated) {
    req.body.status = ORDER_STATUS.CONFIRMED
    req.body.shipped_by = null
    req.body.shipped_at = null
    req.body.allocated_at = null
    req.body.allocated_by = null
  }

  const t = await models.sequelize.transaction()
  try {
    let order = await models.Order.create(req.body, { transaction: t })

    for (let i = 0; i < orderItems.length; i++) {
      const { material_code, batches, stocks } = orderItems[i]
      let ordered_qty = 0

      if (Array.isArray(batches) && batches.length > 0) {
        ordered_qty = 0
        batches.forEach((el) => ordered_qty += parseInt(el.qty))
      } else if (Array.isArray(stocks) && stocks.length > 0) {
        ordered_qty = 0
        stocks.forEach((el) => ordered_qty += parseInt(el.qty))
      }

      const material = await models.MasterMaterial.findOne({
        where: { code: material_code },
      })

      const vendorMaterialEntity = await models.EntityMasterMaterial.findOne({
        where: { master_material_id: material.id, entity_id: vendorId },
      })

      const orderItem = await models.OrderItem.create({
        qty: ordered_qty,
        confirmed_qty: ordered_qty,
        master_material_id: material.id,
        order_id: order.id,
        created_by: user.id,
        updated_by: user.id,
      }, { transaction: t })

      const transactionStock = {
        device_type,
        master_material_id: material.id,
        vendor_id: vendorId,
        customer_id: customerId,
        activity_id: order.activity_id,
        order_id: order.id,
      }

      if (material.managed_in_batch) {
        for (let j = 0; j < batches.length; j++) {
          const batch = batches[j]

          const stock = {
            entity_has_material_id: vendorMaterialEntity.id,
            batch,
            ordered_qty: batch.qty,
            qty: batch.qty,
            order_item_id: orderItem.id,
            user_id: user.id,
            activity_id: batch.activity_id,
            year: batch.year,
            budget_source: batch.source_material_id,
            price: batch.price,
            total_price: batch.total_price
          }

          let orderStockPurchase = null
          if (batch.price || batch.pieces_purchase_id || batch.source_material_id || batch.year) {
            orderStockPurchase = {
              price: batch.price ?? null,
              year: batch.year ?? null,
              total_price: batch?.total_price ?? null,
              pieces_purchase_id: batch.pieces_purchase_id ?? null,
              source_material_id: batch.source_material_id ?? null
            }
          }

          await createVendorStock({ stock, transactionStock, is_allocated, trx: t, orderStockPurchase })
        }
      } else {
        for (let stockBody of stocks) {
          const stock = {
            entity_has_material_id: vendorMaterialEntity.id,
            id: stockBody.id,
            batch: null,
            ordered_qty: stockBody.qty,
            qty: stockBody.qty,
            order_item_id: orderItem.id,
            user_id: user.id,
            activity_id: stockBody.activity_id,
            year: stockBody.year || null,
            price: stockBody.price || null,
            total_price: stockBody.total_price || null,
            budget_source : stockBody.budget_source || null
          }

          let orderStockPurchase = {
            price: stockBody.price ?? null,
            year: stockBody.year ?? null,
            total_price: stockBody?.total_price ?? null,
            pieces_purchase_id: stockBody.pieces_purchase_id ?? null,
            source_material_id: stockBody.source_material_id ?? null
          }

          await createVendorStock({ stock, transactionStock, is_allocated, trx: t, orderStockPurchase })
        }
      }

      const customerMaterialEntity = await models.EntityMasterMaterial.findOne({
        where: { master_material_id: material.id, entity_id: customerId },
      })
      if (!customerMaterialEntity) {
        // First create on hand stock zero
        vendorMaterialEntity.on_hand_stock = 0
        vendorMaterialEntity.allocated_stock = 0
        await models.EntityMasterMaterial.create({
          ..._.omit(vendorMaterialEntity.dataValues, ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by']),
          entity_id: customerId,
          created_by: user.id,
          updated_by: user.id,
        }, { transaction: t })
      }
    }

    if (orderComment) {
      await models.OrderComment.create({
        ...orderComment,
        order_id: order.id,
        user_id: user.id,
        order_status: ORDER_STATUS.PENDING,
        created_by: user.id,
        updated_by: user.id,
      }, { transaction: t })
    }

    if(req.body.din_order_id){
      var dinOrderId = req.body.din_order_id
      const dinOrder = await models.DinOrder.findByPk(dinOrderId)
      if(dinOrder){
        dinOrder.exist_smile = order.id
        await dinOrder.save({transaction : t})
      }
    }

    await t.commit()

    order = await models.Order.findByPk(order.id, {
      include: {
        association: 'activity',
        attributes: ['id', 'name'],
      }
    })

    if (!is_allocated) {
      await generateOrderNotification(order)
    }

    return res.status(201).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

async function findOrCreateBatch({ batch, user_id, trx }) {
  let batchId = null
  const manufacture = await models.Manufacture.findOne({
    where: { name: batch.manufacture_name },
  })

  const sourceBatch = await models.Batch.findOne({
    where: { code: batch.code },
  })

  if (sourceBatch) {
    batchId = sourceBatch.id
  } else {
    const newBatch = await models.Batch.create({
      code: batch.code,
      expired_date: batch.expired_date,
      production_date: batch.production_date,
      manufacture_id: manufacture.id,
    })

    batchId = newBatch.id
  }
  return batchId
}

async function createVendorStock({ stock, transactionStock, is_allocated, trx, orderStockPurchase = null }) {
  try {
    const {
      entity_has_material_id, batch, ordered_qty, qty, order_item_id, user_id, activity_id,
      year, price, total_price, budget_source
    } = stock
    let batchId = batch ? await findOrCreateBatch({ batch, user_id, trx }) : null

    let vendorStock = await models.Stock.findOne({
      where: { batch_id: batchId, entity_has_material_id, activity_id },
    })
    if (!vendorStock) {
      const stockData = {
        batch_id: batchId,
        entity_has_material_id,
        qty: 0,
        created_by: user_id,
        updated_by: user_id,
        activity_id
      }

      if(year) stockData.year = year
      if(price) stockData.price = price
      if(total_price) stockData.total_price = total_price
      if(budget_source) stockData.budget_source = budget_source
      
      vendorStock = await models.Stock.create(stockData, { transaction: trx })
    }
    
    const issueTransaction = {
      ...transactionStock,
      change_qty: -Number(qty),
      opening_qty: vendorStock.qty,
      entity_id: transactionStock.vendor_id,
      stock_id: vendorStock.id,
      transaction_type_id: TRANSACTION_TYPE.ISSUES,
      created_by: user_id,
      updated_by: user_id,
    }

    if (!is_allocated) {
      if (Number(vendorStock.qty) < qty) {
        const stockCountTransaction = JSON.parse(JSON.stringify(issueTransaction))
        stockCountTransaction.change_qty = Number(qty)
        stockCountTransaction.transaction_type_id = TRANSACTION_TYPE.STOCK_COUNT
        await models.Transaction.create(stockCountTransaction, { transaction: trx })
        issueTransaction.opening_qty = Number(qty)
      }
      await models.Transaction.create(issueTransaction, { transaction: trx })
    }

    if (vendorStock.qty != 0 && !is_allocated) {
      const updateQty = Number(vendorStock.qty) - Number(qty)
      const stockData = {
        qty: updateQty,
        updated_by: user_id
      }
      
      if(year) stockData.year = year
      if(price) stockData.price = price
      if(total_price) stockData.total_price = total_price
      if(budget_source) stockData.budget_source = budget_source
      await vendorStock.update(stockData, { transaction: trx })
    }

    let OrderStock = await models.OrderStock.create({
      ordered_qty,
      allocated_qty: qty,
      order_item_id,
      stock_id: vendorStock.id,
      created_by: user_id,
      updated_by: user_id,
    }, { transaction: trx })

    if (orderStockPurchase && typeof (orderStockPurchase) == 'object' && OrderStock.id) {
      let stockPurchase = await models.OrderStockPurchase.create({
        order_stock_id: OrderStock.id,
        source_material_id: orderStockPurchase.source_material_id,
        year: orderStockPurchase.year,
        price: orderStockPurchase.price,
        pieces_purchase_id: orderStockPurchase.pieces_purchase_id,
        total_price: orderStockPurchase?.total_price
      }, { transaction: trx })

      console.log(stockPurchase.id, stockPurchase.total_price, "===")
    }

  } catch (err) {
    throw err
  }
}