import { param } from 'express-validator'
import { commonNotExistsId } from '../customValidator'
import models from '../../models'

export const general = [
  param('customer_id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.id.customer_id') }))
    .isNumeric().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.id.customer_id') }))
    .custom(customerAndIdNotMatch),
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.id.common_id') }))
    .isNumeric().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.id.common_id') }))
    .custom(commonNotExistsId('IntegrationAyoSehat', 'id'))
    .custom(customerAndIdNotMatch),
]

export async function customerAndIdNotMatch(value, { req }) {
  let { id, customer_id } = req.params
  let ayoSehat = await models.IntegrationAyoSehat.findOne({ where: { id: id, customer_id: customer_id } })
  if (!ayoSehat) {
    throw Error(req.__('validator.not_exist', { field: 'id or customer_id' }))
  }

  return true
}