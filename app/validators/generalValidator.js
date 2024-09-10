import { body } from 'express-validator'
import { STATUS } from '../helpers/constants'
import {
  constantNotExist
} from './customValidator'

export const updateStatus = [
  body('status')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: 'Status'
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: 'Status'
    }))
    .custom(constantNotExist(STATUS, 'status'))
]