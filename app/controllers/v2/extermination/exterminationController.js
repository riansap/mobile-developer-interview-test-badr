import {
  DEVICE_TYPE,
  ENTITY_TYPE,
  EXTERMINATION_ORDER_TYPE,
  EXTERMINATION_TRANSACTION_TYPE,
  ORDER_STATUS,
  USER_ROLE
} from '../../../helpers/constants'
import models from '../../../models'
import _ from 'lodash'

export async function ship(req, res, next) {
  const device_type = DEVICE_TYPE[req.headers['device-type']]
  const {user} = req
  let vendorId
  let customerId

  const customer = await models.Entity.findOne({
    where: {code: req.body.customer_code},
  })

  if (!customer) return res.status(400).json({message: 'Invalid customer_code'})

  customerId = customer.id

  let vendor = req.user.entity
  if (user.role === USER_ROLE.SUPERADMIN) {
    vendor = await models.Entity.findOne({
      where: {code: req.body.vendor_code},
    })
    if (!vendor) return res.status(400).json({message: 'Invalid vendor_code'})
    vendorId = vendor.id
  } else {
    vendorId = req.user.entity_id
  }

  let isValidVendorCustomerRelation = true
  switch (vendor.type) {
  case ENTITY_TYPE.FASKES:
    if (!customer.province_id) break
    isValidVendorCustomerRelation = customer.type <= vendor.type && (vendor.regency_id === customer.regency_id || vendor.province_id === customer.province_id)
    break
  case ENTITY_TYPE.KOTA:
    if (!customer.province_id) break
    isValidVendorCustomerRelation = vendor.province_id === customer.province_id && customer.type < vendor.type
    break
  case ENTITY_TYPE.PROVINSI:
    if (!customer.province_id) break
    isValidVendorCustomerRelation = ![1,2,3].includes(customer.type)
    break
  default:
    break
  }

  if (!isValidVendorCustomerRelation) return res.status(403).json({error: 'Invalid vendor-customer relation'})

  const {
    order_items: orderItems,
    order_comment: orderComment,
  } = req.body

  req.body.type = EXTERMINATION_ORDER_TYPE.EXTERMINATION

  req.body = {
    ...req.body,
    status: ORDER_STATUS.SHIPPED,
    customer_id: customerId,
    vendor_id: vendorId,
    confirmed_by: null,
    allocated_by: null,
    shipped_by: user.id,
    confirmed_at: null,
    allocated_at: null,
    shipped_at: new Date(),
    device_type,
    created_by: user.id,
    updated_by: user.id,
  }

  const t = await models.sequelize.transaction()
  try {
    let order = await models.Order.create(req.body, {transaction: t})

    for (let i = 0; i < orderItems.length; i++) {
      const {stocks, ordered_qty, material_id} = orderItems[i]


      const vendorMaterialEntity = await models.EntityMasterMaterial.findOne({
        where: {master_material_id: material_id, entity_id: vendorId},
      })

      const orderItem = await models.OrderItem.create({
        qty: ordered_qty,
        confirmed_qty: ordered_qty,
        master_material_id: material_id,
        order_id: order.id,
        created_by: user.id,
        updated_by: user.id,
      }, {transaction: t})

      let orderStockExterminationPayloads = []


      for (let stock of stocks) {
        const orderStock = await models.OrderStock.create({
          order_item_id: orderItem.id,
          stock_id: stock.stock_id,
          allocated_qty: stock.stock_qty,
          created_by: user.id,
          updated_by: user.id,
        }, {transaction: t})

        for (let stockExtermination of stock.stock_exterminations) {
          orderStockExterminationPayloads.push({
            order_stock_id: orderStock.id,
            status: ORDER_STATUS.SHIPPED,
            stock_extermination_id: stockExtermination.stock_extermination_id,
            allocated_discard_qty: stockExtermination.discard_qty,
            allocated_received_qty: stockExtermination.received_qty,
          })


          let existingStockExtermination = await models.StockExtermination.findByPk(stockExtermination.stock_extermination_id, {transaction: t})
          if (!existingStockExtermination) {
            await t.rollback()
            return res.status(422).json({error: 'Extermination stock not found'})
          }
          await models.ExterminationTransaction.create({
            extermination_transaction_type_id: EXTERMINATION_TRANSACTION_TYPE.SHIP,
            master_material_id: material_id,
            activity_id: stock.activity_id,
            customer_id: customerId,
            vendor_id: vendorId,
            entity_id: vendorId,
            stock_extermination_id: stockExtermination.stock_extermination_id,
            order_id: order.id,
            opening_qty: Number(existingStockExtermination.extermination_discard_qty) + Number(existingStockExtermination.extermination_received_qty),
            change_qty: -Number(stockExtermination.discard_qty + stockExtermination.received_qty),
            created_by: user.id,
            updated_by: user.id,
          }, {transaction: t})

          existingStockExtermination.extermination_shipped_qty += stockExtermination.discard_qty + stockExtermination.received_qty
          existingStockExtermination.extermination_discard_qty -= stockExtermination.discard_qty
          existingStockExtermination.extermination_received_qty -= stockExtermination.received_qty

          if (existingStockExtermination.stock_id !== stock.stock_id) {
            await t.rollback()
            return res.status(400).json({error: req.__('validator.exists', { field: req.__('extermination') })})
          }
          if (existingStockExtermination.extermination_discard_qty < 0) {
            await t.rollback()
            return res.status(400).json({error: req.__('validator.not_empty', { field: 'existing discard_qty' })})
          }
          if (existingStockExtermination.extermination_received_qty < 0) {
            await t.rollback()
            return res.status(400).json({error: req.__('validator.not_empty', { field: 'existing received_qty' })})
          }

          await existingStockExtermination.save({transaction: t})
        }
      }

      await models.OrderStockExtermination.bulkCreate(orderStockExterminationPayloads, {transaction: t})

      const customerMaterialEntity = await models.EntityMasterMaterial.findOne({
        where: {master_material_id: material_id, entity_id: customerId},
      })
      if (!customerMaterialEntity) {
        await models.EntityMasterMaterial.create({
          ..._.omit(vendorMaterialEntity.dataValues, ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by']),
          entity_id: customerId,
          created_by: user.id,
          updated_by: user.id,
        }, {transaction: t})
      }
    }

    if (orderComment) {
      await models.OrderComment.create({
        ...orderComment,
        order_id: order.id,
        user_id: user.id,
        order_status: ORDER_STATUS.SHIPPED,
        created_by: user.id,
        updated_by: user.id,
      }, {transaction: t})
    }

    await t.commit()

    order = await models.Order.findByPk(order.id, {
      include: {
        association: 'activity',
        attributes: ['id', 'name'],
      }
    })

    order.device_type = device_type
    order.save()

    return res.status(201).json(order)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function fulfill(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const {comment} = req.body
    const {id} = req.params
    const user = req.user
    const order = await models.Order.findByPk(id, {transaction: t, lock: true})
    const previousStatus = order.status

    if (order.status === ORDER_STATUS.FULFILLED) {
      await t.rollback()
      return res.status(403).json({error: 'Order already fulfilled'})
    }

    if (user.role !== USER_ROLE.SUPERADMIN) {
      if (user.entity_id !== order.customer_id) {
        await t.rollback()
        return res.status(403).json({error: 'Mismatch logged user with customer'})
      }
    }
    

    order.status = ORDER_STATUS.FULFILLED
    order.fulfilled_by = user.id
    order.fulfilled_at = new Date()
    await order.save({transaction: t})

    const orderItems = await models.OrderItem.findAll({
      where: {order_id: order.id},
      without_relations: true,
      include: [
        {
          association: 'order_stocks',
          include: [
            {
              association: 'order_stock_exterminations',
              include: [
                {
                  association: 'stock_extermination',
                  attributes: models.StockExtermination.getBasicAttributes(),
                },
              ]
            },
            {
              association: 'stock'
            },
          ]
        }
      ]
    }, {transaction: t})

    if (previousStatus === ORDER_STATUS.INDEPENDENT_EXTERMINATION) {
      for (const orderItem of orderItems) {
        for (const orderStock of orderItem.order_stocks) {
          orderStock.received_qty = orderStock.allocated_qty
          orderStock.fulfill_status = ORDER_STATUS.FULFILLED
          await orderStock.save({transaction: t})
        }
      }
      await t.commit()
      
      return res.status(202).json({ message: 'success', order })
    }


    // GOALS:
    // 1. Update Order Stock Received QTY
    // 2. Create Received Transactions
    // 3. Update Customer's Stock Extermination

    let transactionExterminationPayloads = []
    for (const orderItem of orderItems) {
      let materialCustomer = await findOrCreateEntityMasterMaterial({
        master_material_id: orderItem.master_material_id,
        entity_id: order.customer_id,
        user_id: user.id,
        t
      })

      for (const orderStock of orderItem.order_stocks) {
        const stockCustomer = await findOrCreateStock({
          customer_material: materialCustomer,
          order_stock: orderStock,
          user,
          t
        })

        orderStock.received_qty = orderStock.allocated_qty
        orderStock.fulfill_status = ORDER_STATUS.FULFILLED
        await orderStock.save({transaction: t})
        for (const orderStockExtermination of orderStock.order_stock_exterminations) {
          const stockExterminationCustomer = await findOrCreateStockExtermination({
            stock: stockCustomer,
            transaction_reason_id: orderStockExtermination.stock_extermination.transaction_reason_id,
            user,
            t
          })
          const changeQty = orderStockExtermination.allocated_discard_qty + orderStockExtermination.allocated_received_qty
          transactionExterminationPayloads.push({
            extermination_transaction_type_id: EXTERMINATION_TRANSACTION_TYPE.RECEIVE,
            master_material_id: orderItem.master_material_id,
            activity_id: orderStock.stock.activity_id,
            customer_id: order.customer_id,
            vendor_id: order.vendor_id,
            entity_id: order.customer_id, // extermination_type_id == 3 & order_status == 5 ? entity_id = customer_id
            stock_extermination_id: stockExterminationCustomer.id,
            order_id: order.id,
            opening_qty: stockExterminationCustomer.extermination_discard_qty + stockExterminationCustomer.extermination_received_qty,
            change_qty: changeQty,
            created_by: user.id,
          })

          stockExterminationCustomer.extermination_received_qty += changeQty
          await stockExterminationCustomer.save({transaction: t})
        }
      }
    }

    await models.ExterminationTransaction.bulkCreate(transactionExterminationPayloads, {transaction: t})

    if (comment && comment !== '') {
      await models.OrderComment.create({
        comment,
        order_id: order.id,
        user_id: user?.id || null,
        order_status: order.status === ORDER_STATUS.FULFILLED ? ORDER_STATUS.FULFILLED : ORDER_STATUS.PENDING,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
      }, {transaction: t})
    }

    await t.commit()
    return res.json(orderItems)
  } catch (e) {
    await t.rollback()
    next(e)
  }
}

export async function cancel(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const {comment} = req.body
    const {id} = req.params
    const user = req.user
    const order = await models.Order.findOne({
      attributes: models.Order.getBasicAttribute(),
      without_relations: true,
      where: {
        id: id
      },
      include: [
        {
          association: 'order_items',
          attributes: models.OrderItem.getBasicAttribute(),
          include: [
            {
              association: 'order_stocks',
              attributes: models.OrderStock.getBasicAttribute(),
              include: [
                {
                  association: 'order_stock_exterminations',
                  attributes: models.OrderStockExtermination.getBasicAttribute(),
                  include: [
                    {
                      association: 'stock_extermination',
                      attributes: models.StockExtermination.getBasicAttributes(),
                    },
                  ]
                },
                {
                  association: 'stock',
                  attributes: models.Stock.getBasicAttribute(),
                },
              ]
            },
          ]
        }
      ],
      transaction: t
    })

    if (!order) {
      await t.rollback()
      return res.status(404).json({error: 'Order not found'})
    }

    if (order.status === ORDER_STATUS.FULFILLED || order.status === ORDER_STATUS.CANCELED) {
      await t.rollback()
      return res.status(403).json({error: 'Order already fulfilled/canceled'})
    }

    if (user.role !== USER_ROLE.SUPERADMIN) {
      if (user.entity_id !== order.vendor_id) {
        await t.rollback()
        return res.status(403).json({error: 'Mismatch logged user with order vendor'})
      }
    }

    let transactionExterminationPayloads = []
    for (const orderItem of order.order_items) {
      for (const orderStock of orderItem.order_stocks) {
        for (const orderStockExtermination of orderStock.order_stock_exterminations) {
          const stockExtermination = orderStockExtermination.stock_extermination
          const changeQty = orderStockExtermination.allocated_discard_qty + orderStockExtermination.allocated_received_qty

          transactionExterminationPayloads.push({
            extermination_transaction_type_id: EXTERMINATION_TRANSACTION_TYPE.RECEIVE,
            master_material_id: orderItem.master_material_id,
            activity_id: orderStock.stock.activity_id,
            customer_id: order.customer_id,
            vendor_id: order.vendor_id,
            entity_id: order.vendor_id,
            stock_extermination_id: orderStockExtermination.stock_extermination_id,
            order_id: order.id,
            opening_qty: stockExtermination.extermination_ready_qty,
            change_qty: changeQty,
            created_by: user.id,
          })

          stockExtermination.extermination_received_qty += orderStockExtermination.allocated_received_qty
          stockExtermination.extermination_discard_qty += orderStockExtermination.allocated_discard_qty
          stockExtermination.extermination_shipped_qty -= changeQty
          await stockExtermination.save({transaction: t})
        }
      }
    }

    await models.ExterminationTransaction.bulkCreate(transactionExterminationPayloads, {transaction: t})

    if (comment && comment !== '') {
      await models.OrderComment.create({
        comment,
        order_id: order.id,
        user_id: user?.id || null,
        order_status: ORDER_STATUS.CANCELED,
        created_by: req.body.created_by,
        updated_by: req.body.updated_by,
      }, {transaction: t})
    }

    order.status = ORDER_STATUS.CANCELED
    order.cancelled_at = new Date()
    order.cancelled_by = req.user.id
    await order.save({transaction: t})

    await t.commit()

    return res.json(order)
  } catch (e) {
    await t.rollback()
    next(e)
  }
}

async function findOrCreateEntityMasterMaterial({master_material_id, entity_id, user_id, t}) {
  const materialCustomerField = {
    master_material_id,
    entity_id
  }
  var entityMasterMaterial = await models.EntityMasterMaterial.findOne({
    where: materialCustomerField,
    include: [
      {
        association: 'material'
      },
      {
        association: 'entity'
      },
    ]
  })
  if (!entityMasterMaterial) {
    entityMasterMaterial = await models.EntityMasterMaterial.create({
      ...materialCustomerField,
      created_by: user_id,
      updated_by: user_id
    }, {transaction: t})
  }

  return entityMasterMaterial
}

async function findOrCreateStock({customer_material, order_stock, user, t}) {
  let stockField = {
    entity_has_material_id: customer_material.id,
    activity_id: order_stock.stock.activity_id,
    batch_id: order_stock.stock.batch_id
  }
  let stockCustomer = await models.Stock.findOne({
    where: stockField,
    lock: {
      level: true,
      of: models.Stock
    },
    transaction: t,
  })

  if (!stockCustomer) {
    stockCustomer = await models.Stock.create({
      ...stockField,
      qty: 0,
      created_by: user.id,
      updated_by: user.id
    }, {transaction: t})
  }
  return stockCustomer
}

async function findOrCreateStockExtermination({stock, transaction_reason_id, user, t}) {
  let stockExterminationField = {
    stock_id: stock.id,
    transaction_reason_id,
  }
  let stockExterminationCustomer = await models.StockExtermination.findOne({
    where: stockExterminationField,
    lock: {
      level: true,
      of: models.StockExtermination
    },
    transaction: t,
  })
  if (!stockExterminationCustomer) {
    stockExterminationCustomer = await models.StockExtermination.create({
      ...stockExterminationField,
      extermination_discard_qty: 0,
      extermination_received_qty: 0,
      extermination_qty: 0,
      extermination_shipped_qty: 0,
      created_by: user.id,
      updated_by: user.id
    }, {transaction: t})
  }

  return stockExterminationCustomer
}
