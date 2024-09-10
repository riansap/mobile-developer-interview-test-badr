import { check } from 'express-validator'
import { isXLS } from './customValidator'

export const uploadXLS = [
  check('file')
    .custom(isXLS),
]
