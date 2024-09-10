import { param, query } from 'express-validator'
import { commonNotExistsField } from '../customValidator'

export const general = [
  query('year')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.year') }))
    .isNumeric().withMessage((value, { req }) => req.__('validator.number', { field: req.__('field.year') })),
  query('date_cutoff')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.date_cutoff') }))
    .isDate().withMessage((value, { req }) => req.__('validator.date_format', { field: req.__('field.date_cutoff'), format: "YYYY-MM-DD" }))
]

export const dataProvince = [
  query('code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.id.province_id') }))
    .custom(commonNotExistsField('IntegrationEmonevProvince', 'code', 'id.province_id')),
  ...general
]

export const dataRegency = [
  query('code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.id.regency_id') }))
    .custom(commonNotExistsField('IntegrationEmonevRegency', 'code', 'id.regency_id')),
  ...general
]

export async function dateCutoffAndYearNotMatch(value, { req }) {
  let { year, date_cutoff } = req.query
  let year_cutoff = new Date(date_cutoff).getFullYear()

  if (year != year_cutoff) {
    throw Error(req.__('validator.year_not_match'))
  }

  return true
}