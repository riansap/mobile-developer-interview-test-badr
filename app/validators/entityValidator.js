import { body, param } from 'express-validator'
import { ENTITY_TYPE } from '../helpers/constants'
import { constantNotExist, commonNotExistsId, commonExistsFieldUpdate, commonExistsField, checkIsOnlySpace } from './customValidator'
import { updateStatus } from '../validators/generalValidator'
import models from '../models'
import { Op } from 'sequelize'
import { ErrorValue } from 'exceljs'
import moment from 'moment'

const general = [
  body('name')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.name')
    }))
    .custom(checkIsOnlySpace('field.entity.name')),
  body('address')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.address')
    })),
  body('type')
    .optional({ nullable: true })
    .custom(constantNotExist(ENTITY_TYPE, 'field.entity.type')),
  body('village_id')
    .optional({ nullable: true })
    .custom(commonNotExistsId('Village', 'id.village_id')),
  body('sub_district_id')
    .optional({ nullable: true })
    .custom(commonNotExistsId('SubDistrict', 'id.sub_district_id')),
  body('regency_id')
    .optional({ nullable: true })
    .custom(commonNotExistsId('Regency', 'id.regency_id')),
  body('province_id')
    .optional({ nullable: true })
    .custom(commonNotExistsId('Province', 'id.province_id')),
  body('postal_code')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.entity.postal_code')
    })),
  body('lat')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.entity.lat')
    })),
  body('lng')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.entity.lng')
    })),
  body('code')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.code')
    }))
    .custom(checkIsOnlySpace('field.entity.name')),
  body('rutin_join_date')
    .optional({ nullable: true })
    .isDate()
    .withMessage((value, { req }) => req.__('validator.date', {
      field: req.__('field.entity.rutin_join_date')
    })),
  body('entity_tags.*')
    .isNumeric()
    .custom(commonNotExistsId('EntityTag', 'id.entity_tag_id')),
  body('is_ayosehat')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 1 })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.entity.is_ayosehat')
    }))
]

export const create = [
  body('code')
    .custom(commonExistsField('Entity', 'code', 'entity.code')),
  body('activities_date.*')
    .custom(isEndDateAfterJoinDate),
  ...general
  // body('region_id')
  //   .notEmpty()
  //   .withMessage((value, {req}) => req.__('validator.not_empty', { field: req.__('field.id.region_id') }))
]

export const update = [
  param('id')
    .notEmpty()
    .withMessage((value, { req }) => req.__('validator.not_empty', {
      field: req.__('field.entity.id')
    }))
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.entity.id')
    })),
  body('code')
    .custom(commonExistsFieldUpdate('Entity', 'code', 'entity.code')),
  body('activities_date.*')
    .custom(isEndDateAfterJoinDate),
  ...general
]

export const updateEntityStatus = [
  ...updateStatus,
  param('id')
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.material.id')
    }))
    .custom(entityStatusValidate)
]

async function entityStatusValidate(value, { req }) {
  if (value) {
    const checkActiveOrder = await models.Order.scope('active').count({
      where: {
        [Op.or]: [
          { customer_id: value },
          { vendor_id: value }
        ]
      }
    })
    if (checkActiveOrder) {
      throw Error(
        'Tidak bisa mengubah status, entitas memiliki pesanan aktif'
        // req.__('validator.not_exists', {
        //   field: req.__('field.order_stock.id'),
        // })
      )
    }

    if (req.body.status == 0) {
      const checkRelation = await models.CustomerVendor.count({
        where: {
          [Op.or]: [
            { customer_id: value },
            { vendor_id: value }
          ]
        }
      })

      if (checkRelation) {
        throw Error(
          'Entitas tidak dapat dinonaktifkan karena mempunyai relasi'
        )
      }
    }

  }
  return true
}

function isEndDateAfterJoinDate(value, { req }) {
  const { join_date, end_date } = value

  const joinMoment = moment(join_date)
  const endMoment = moment(end_date).endOf('day')

  if (endMoment.isBefore(joinMoment)) {
    throw new Error(req.__('validator.end_date_before_start_date'))
  }

  return true
}