import { Op } from 'sequelize'
import models from '../models'

const {
  OrderItem,
  OrderItemKfa
} = models
const { sequelize } = models

/**
 * Create order items kfa based on order items (one row perspective):
 * 1. Get master_material_id from order_items
 * 2. Get code_product_template_code from mapping_master_material using above master_material_id 
 * 3. Insert to orders_item_kfa the row data from order_items (step 1) with the addition of code_product_template_code
 * 4. The inserted row id now will be inserted to the corresponding row of order_items (step 1).
 */
export const startCronOrderItemsKfa = async () => {
  const trx = await sequelize.transaction() 
  try {
    const orderItems = await OrderItem.findAll({
      where: {
        order_item_kfa_id: {
          [Op.eq]: null
        }
      },
      transaction: trx
    })

    const orderItemsKfaData = orderItems
      .filter((orderItem) => orderItem.master_material && orderItem.master_material.mapping_master_material)
          
    await Promise.all(orderItemsKfaData.map(async (orderItem) => {
      const orderItemData = {
        order_id: orderItem.order_id,
        code_kfa_product_template: orderItem.master_material.mapping_master_material.code_kfa_product_template, 
        qty: orderItem.qty,
        recomended_stock: orderItem.recomended_stock,
        created_at: orderItem.created_at,
        updated_at: orderItem.updated_at,
        deleted_at: orderItem.deleted_at,
        reason_id: orderItem.reason_id,
        other_reason: orderItem.other_reason,
        confirmed_qty: orderItem.confirmed_qty,
      }

      const orderItemKfa = await OrderItemKfa.create(orderItemData, {
        transaction: trx
      })

      orderItem.order_item_kfa_id = orderItemKfa.id
      await orderItem.save()
    }))

    await trx.commit()
    console.log('Cron Success!')
    return {
      message: 'Cron Success'
    }
  } catch (error) {
    await trx.rollback()
    console.log('Cron Failed!', error)
    return new Error(error)
  }
}