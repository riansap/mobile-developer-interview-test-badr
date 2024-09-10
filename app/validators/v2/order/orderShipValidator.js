import { body } from 'express-validator'

import { orderStatusInvalid, trackDeviceValid } from '../../orderStatusValidator'

import { commonDateMustGreaterThan } from '../../customValidator'

export const ship = [
  body('estimated_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.estimated_date'),
    }))
    .custom(commonDateMustGreaterThan('field.order.estimated_date', null, { isCurrentDate: true })),
  body('track_device')
    .optional({ nullable: true })
    .custom(trackDeviceValid),
  body('actual_shipment')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.order.actual_shipment'),
    })),
  body()
    .custom(orderStatusInvalid),
]
