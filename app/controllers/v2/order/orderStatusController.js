import { createComment } from './orderCommentController'
import models from '../../../models'
import { publishWorker } from '../../../helpers/services/rabbitmqHelper'
import { ORDER_STATUS } from '../../../helpers/constants'
import { formatCreateEasyGoPayload } from '../../../helpers/integrations/easyGoHelper'
import { generateOrderNotification } from '../../../helpers/notifications/orderNotification'

import { triggerColdstorage, updateOrder } from './traits/updateOrder'

function generateEasyGoTrackDevice(order, track_device) {
  if(track_device) {
    const token = req.headers.authorization.split(' ')[1]
    const callbackHost = req.get('host')
    let easyGoCreate = formatCreateEasyGoPayload(order, track_device.nopol, token, callbackHost)
    publishWorker('http-worker', easyGoCreate)
  }
}

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
      actual_shipment
    } = req.body

    // lock with transaction
    let order = await models.Order.findByPk(id, {
      transaction: t,
    })

    let updateField = {
      cancel_reason,
      estimated_date,
      sales_ref,
      taken_by_customer,
      other_reason,
      actual_shipment,
      updated_by: authUser?.id || null
    }

    let orderStatusUser = {
      'confirmed': ORDER_STATUS.CONFIRMED,
      'shipped': ORDER_STATUS.SHIPPED,
      'fulfilled': ORDER_STATUS.FULFILLED,
      'cancelled': ORDER_STATUS.CANCELED
    }

    for (const key in orderStatusUser) {
      if (orderStatusUser[key] === status) {
        updateField[`${key}_by`] = authUser?.id || null
        updateField[`${key}_at`] = req.body[`${key}_at`] || Date.now()
      }
    }
    // start transaction
    try {
      await order.update(updateField, { transaction: t })

      if (comment) {
        await createComment({
          order_id: order.id,
          comment: comment,
          user_id: authUser.id,
          updated_by: authUser.id,
          created_by: authUser.id,
          order_status: status
        }, t)
      }

      // update status
      order.status = status
      // update etc
      const triggerColdstorageData = await updateOrder({order, body: req.body, t, req})
      await order.save({transaction: t})

      if (triggerColdstorageData) {
        const bulkProcess = []
        for (const item of triggerColdstorageData) {
          bulkProcess.push(triggerColdstorage(item.entity_id, item.master_material_id, item.t, item.req)) 
        }
        await Promise.all(bulkProcess)
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
      },
      order_items_projection: true,
    })

    if(order.status === ORDER_STATUS.SHIPPED) {
      generateOrderNotification(order)
      generateEasyGoTrackDevice(order, track_device)
    }

    return res.status(200).json(order)
  } catch (err) {
    console.error(err)
    return next(err)
  }
}
