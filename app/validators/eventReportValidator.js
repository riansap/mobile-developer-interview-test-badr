/* eslint-disable no-underscore-dangle */
/* eslint-disable radix */
/* eslint-disable default-case */
import { body } from 'express-validator'
// import { USER_ROLE } from '../helpers/constants'
import models from '../models'
import {
  checkDateTime, constantNotExist, commonNotExistsId, checkLink,
} from './customValidator'
import { EVENT_REPORT_STATUS, STATUS, USER_ROLE } from '../helpers/constants'
import { flowStatusUpdate } from '../helpers/eventReportHelper'

async function checkEntity(entityID, { req }) {
  if (entityID) {
    const { user } = req
    if (parseInt(user.role) !== USER_ROLE.SUPERADMIN) {
      if (entityID !== user.entity_id) throw Error(req.__('custom.entity_must_same'))
    }
    const entity = await models.Entity.count({
      where: [
        { id: entityID },
        { status: STATUS.ACTIVE },
      ],
    })
    if (!entity) throw Error(req.__('validator.not_exist', { field: req.__('field.id.entity_id') }))
  }
  return true
}

async function checkMaterialDuplicate(items, { req }) {
  if (items) {
    items.forEach((item) => {
      if (item.material_id === null) {
        if (!item.custom_material) throw Error(req.__('validator.not_exist', { field: req.__('field.id.custom_material') }))
      } else if (item.custom_material === null) {
        if (!item.material_id) throw Error(req.__('validator.not_exist', { field: req.__('field.id.material_id') }))
      }
    })
  }
  return true
}

export const create = [
  body('order_id')
    .if((value, { req }) => parseInt(req.body.has_order) === 1)
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.order.id'),
    }))
    .custom(commonNotExistsId('Order', 'id.order_id')),
  body('entity_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.id'),
    }))
    .custom(checkEntity),
  body('has_order')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.event_report.has_order'),
    }))
    .isInt()
    .withMessage((value, { req }) => req.__('validator.not_number', {
      field: req.__('field.event_report.has_order'),
    })),
  body('arrived_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.event_report.arrived_date'),
    }))
    .custom(checkDateTime('arrived_date', 'YYYY-MM-DD')),
  body('no_packing_slip')
    .if((value, { req }) => parseInt(req.body.has_order) === 0)
    .optional({ nullable: true })
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.event_report.no_packing_slip'),
    })),
  body('items')
    .custom(checkMaterialDuplicate),
  body('items.*')
    .custom(checkIsBatch),
  /*body('items.*.no_batch')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.batch.code'),
    }))
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.batch.code'),
    })),*/
  body('items.*.expired_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.batch.expired_date'),
    }))
    .custom(checkDateTime('expired_date', 'YYYY-MM-DD')),
  body('items.*.qty')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.event_report.qty'),
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.event_report.qty'),
    })),
  body('items.*.reason_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.event_report.reason'),
    }))
    .isNumeric()
    .custom(commonNotExistsId('EventReportReason', 'id.order_id')),
  body('items.*.child_reason_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.event_report.child_reason'),
    }))
    .isNumeric()
    .custom(commonNotExistsId('EventReportChildReason', 'event_report.child_reason')),
]


async function checkIsBatch(item, {req}) {
  if(!item.material_id) return true
  const material = await models.MasterMaterial.findByPk(item.material_id)
  if (material.managed_in_batch == 1 && !item.no_batch)
    throw Error(req.__('validator.not_empty', {
      field: req.__('field.batch.code'),
    }))
    //return material.managed_in_batch == 1
}

async function checkStatus(value, { req }) {
  if (value) {
    const { id } = req.params
    const { user } = req
    const eventReport = await models.EventReport.findByPk(id)
    if (!eventReport) throw Error(req.__('404'))
    const updateStatus = parseInt(value)
    const currentStatus = parseInt(eventReport.status)
    // console.log(currentStatus, ' update to ', updateStatus)
    // console.log('Role user', user.role)

    if (currentStatus === updateStatus) throw Error(req.__('custom.order_status_exist'))
    if (currentStatus === EVENT_REPORT_STATUS.FINISH) throw Error(req.__('custom.order_status_fulfilled'))
    if (currentStatus === EVENT_REPORT_STATUS.CANCEL) throw Error(req.__('custom.order_status_cancelled'))

    flowStatusUpdate.forEach((flow) => {
      if (flow.status === currentStatus) {
        const allowedStatus = flow.nextStatus.includes(updateStatus)
        if (!allowedStatus) throw Error('Status tidak bisa diupdate!')
      }
      if (flow.status === updateStatus) {
        const allowedRoles = flow.roles.includes(parseInt(user.role))
        if (!allowedRoles) throw Error('Role ini tidak dapat mengupdate status')
      }
    })

    if (updateStatus === (EVENT_REPORT_STATUS.CANCEL || EVENT_REPORT_STATUS.FINISH)) {
      if (user.role !== USER_ROLE.SUPERADMIN && user.entity_id !== eventReport.entity_id) throw Error(req.__('custom.entity_must_same'))
    }
  }
  return true
}

export const status = [
  body('status')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.status.id'),
    }))
    .custom(constantNotExist(EVENT_REPORT_STATUS, 'field.order.cancel_reason'))
    .custom(checkStatus),
]

export const link = [
  body('link')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Link',
    }))
    .custom(checkLink),
]
