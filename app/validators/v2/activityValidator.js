import { body, param } from 'express-validator'
import { ORDER_STATUS } from '../../helpers/constants'
import models from '../../models'
import { Op } from 'sequelize'

import {
  commonNotExistsId,
  commonExistsField,
  commonExistsFieldUpdate
} from '../customValidator'



function checkedProcess(field1, field2) {
  return function (value, { req }) {
    let value2 = req.body[field2]

    if (value == 0 && value2 == 0) {
      throw Error(req.__('validator.selected_atleast_one', { field1: req.__(`field.activity.${field1}`), field2: req.__(`field.activity.${field2}`) }))
    }

    return true
  }
}

export const general = [
  body('is_ordered_sales')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.activity.is_ordered_sales')
    }))
    .isInt({ min: 0, max: 1 })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.activity.is_ordered_sales')
    }))
    .custom(checkedProcess('is_ordered_sales', 'is_ordered_purchase')),
  body('is_ordered_purchase')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.activity.is_ordered_purchase')
    }))
    .isInt({ min: 0, max: 1 })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.activity.is_ordered_purchase')
    }))
    .custom(checkedProcess('is_ordered_purchase', 'is_ordered_sales')),
]

export const create = [
  body('name')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.activity.name')
    }))
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.activity.name')
    }))
    .custom(commonExistsField('MasterActivity', 'name', 'activity.name')),
  ...general
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.activity.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.activity.id')
    }))
    .custom(commonNotExistsId('MasterActivity', 'activity.id')),
  body('name')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.activity.name')
    }))
    .isString()
    .withMessage((value, { req }) => req.__('validator.string', {
      field: req.__('field.activity.name')
    }))
    .custom(commonExistsFieldUpdate('MasterActivity', 'name', 'activity.name')),
  ...general
]

async function checkActiveOrder(value, { req }) {
  if (value) {
        
    const countActiveOrder = await models.Order.count({
      where: {
        activity_id : value,
        [Op.not]: {
          status: [ORDER_STATUS.CANCELED]
        }
      }
    })
    if (countActiveOrder) {
      throw Error(
        req.__('validator.delete_active_order')
      )
    }

    const countTransaction = await models.Transaction.count({
      where : {
        activity_id : value
      }
    })

    if(countTransaction){
      throw Error(
        req.__('validator.delete_has_transaction')
      )
    }
  }
  return true
}

export const destroy =[
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.activity.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.activity.id')
    }))
    .custom(commonNotExistsId('MasterActivity', 'activity.id'))
    .custom(checkActiveOrder),
]