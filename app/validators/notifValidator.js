import { body } from 'express-validator'
import { commonNotExistsId } from './customValidator'

export const create = [
    body('patient_id')
        .notEmpty()
        .withMessage((value, { req }) => req.__('validator.not_empty', {
            field: req.__('field.transaction.patient_id')
        }))
        .isNumeric()
        .withMessage((value, { req }) => req.__('validator.number', {
            field: req.__('field.transaction.patient_id')
        }))
        .custom(commonNotExistsId('Patient', 'transaction.patient_id')),
    body('reason_id')
        .notEmpty()
        .withMessage((value, { req }) => req.__('validator.not_empty', {
            field: req.__('field.id.reason_id')
        }))
        .isNumeric()
        .withMessage((value, { req }) => req.__('validator.number', {
            field: req.__('field.id.reason_id')
        }))
        .custom(commonNotExistsId('StopNotificationReason', 'id.reason_id'))
]