import { body, query, param } from 'express-validator'
import { commonDateMustGreaterThan, commonExistsTwoField } from '../customValidator'
import models from '../../models'

const { OpnamePeriod } = models

const common = [
  body('start_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__("field.opname_period.start_date")
    })),
  body('end_date')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__("field.opname_period.end_date")
    })),
  body('end_date')
    .custom(commonDateMustGreaterThan('field.opname_period.end_date', 'field.opname_period.start_date')),
  body('month_periode')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__("field.opname_period.month_periode")
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.opname_period.month_periode')
    })),
  body('year_periode')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__("field.opname_period.year_periode")
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.opname_period.year_periode')
    }))

]

const create = [
  ...common,
  body('start_date')
    .custom(commonExistsTwoField('OpnamePeriod', 'field.opname_period.start_date', 'field.opname_period.end_date')),
  body('month_periode')
    .custom(commonExistsTwoField('OpnamePeriod', 'field.opname_period.month_periode', 'field.opname_period.year_periode'))
]
const update = [
  ...common,
  body('start_date')
    .custom(commonExistsTwoField('OpnamePeriod', 'field.opname_period.start_date', 'field.opname_period.end_date', { isUpdate: true })),
  body('month_periode')
    .custom(commonExistsTwoField('OpnamePeriod', 'field.opname_period.month_periode', 'field.opname_period.year_periode', {isUpdate : true})),
  param('id')
    .custom(async (value, { req }) => {
      const data = await OpnamePeriod.findByPk(value)
      if (data && data.status != 1) {
        throw new Error(req.__("validator.must_active"))
      }
      return true
    })
]

const list = [
  query('start_date')
    .optional()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__("field.opname_period.start_date")
    })),
  query('end_date')
    .optional()
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__("field.opname_period.end_date")
    }))
    .custom(commonDateMustGreaterThan('field.opname_period.end_date', 'field.opname_period.start_date', { isQuery: true })),
]

export default {
  create,
  update,
  list
}

