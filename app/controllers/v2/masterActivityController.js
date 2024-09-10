import { Op } from 'sequelize'
import models from '../../models'
import { formatWIB } from '../../helpers/common'
import moment from 'moment'

const { EntityActivityDate, Entity } = models

export async function list(req, res, next) {
  try {
    let condition = []

    const { keyword } = req.query


    if (keyword) condition.push({
      name: {
        [Op.like]: `%${keyword}%`
      }
    })

    req.order = [
      [['name', 'ASC']]
    ]
    req.include = [
      {
        association: 'user_updated_by',
        attributes: ['id', 'firstname', 'lastname']
      },
      {
        association: 'user_created_by',
        attributes: ['id', 'firstname', 'lastname']
      }
    ]

    req.xlsColumns = [
      { key: 'name', title: req.__('field.activity.name') },
      { key: 'is_ordered_sales', title: req.__('field.activity.is_ordered_sales') },
      { key: 'is_ordered_purchase', title: req.__('field.activity.is_ordered_purchase') },
      { key: 'created_at', title: req.__('field.activity.created_at') },
      { key: 'updated_at', title: req.__('field.activity.updated_at') },
      { key: 'created_by', title: req.__('field.activity.created_by') },
      { key: 'updated_by', title: req.__('field.activity.updated_by') }
    ]

    req.mappingContents = ({ data }) => {

      let { user_created_by, user_updated_by } = data

      let item = {
        ...data.dataValues,
      }
      item.updated_by = user_updated_by ? user_updated_by?.firstname + ' ' + (user_updated_by?.lastname || '') : ''
      item.created_by = user_created_by ? user_created_by?.firstname + ' ' + (user_created_by?.lastname || '') : ''
      item.is_ordered_sales = req.__(`field.selected.${item.is_ordered_sales}`)
      item.is_ordered_purchase = req.__(`field.selected.${item.is_ordered_purchase}`)
      delete item.user_updated_by
      delete item.user_created_by
      item.updated_at = item.updated_at ? formatWIB(item.updated_at, 'YYYY-MM-DD HH:mm') : ''
      item.created_at = item.created_at ? formatWIB(item.created_at, 'YYYY-MM-DD HH:mm') : ''

      return item
    }

    req.xlsFilename = `Data ${req.__('field.id.activity_id')} ${Date()}`

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function customList(req, res, next) {
  try {
    const { keyword, entity_id } = req.query
    const currentDateTime = moment()
    const currentDate = currentDateTime.format('YYYY-MM-DD')

    let condition = []

    if (keyword) condition.push({
      name: {
        [Op.like]: `%${keyword}%`
      }
    })

    req.order = [
      [['id', 'ASC']]
    ]

    if (entity_id) {
      req.customOptions = {
        raw: true
      }

      req.include = [
        {
          model: Entity,
          as: 'activities_date',
          attributes: [['id', 'entity_id'], 'name'],
          through: {
            model: EntityActivityDate,
            attributes: ['id', 'join_date', 'end_date'],
            where: {
              entity_id,
              join_date: {
                [Op.not]: null
              },
              [Op.or]: [
                {
                  [Op.and]: [
                    {
                      join_date: { [Op.lte]: currentDate }
                    },
                    {
                      end_date: { [Op.gte]: currentDate }
                    }
                  ]
                },
                {
                  [Op.and]: [
                    {
                      end_date: null
                    },
                    {
                      join_date: { [Op.lte]: currentDate }
                    }
                  ]
                }
              ]
            },
            required: true,
          },
        },
      ]

      req.mappingDocs = ({ docs }) => {
        return docs.map((doc) => {
          const newDoc = {
            ...doc,
            join_date: doc['activities_date.entity_activity_date.join_date'],
            end_date: doc['activities_date.entity_activity_date.end_date'],
          }

          delete newDoc['activities_date.entity_id']
          delete newDoc['activities_date.name']
          delete newDoc['activities_date.entity_activity_date.id']
          delete newDoc['activities_date.entity_activity_date.join_date']
          delete newDoc['activities_date.entity_activity_date.end_date']

          return newDoc
        })
      }
    }

    return next()
  } catch (error) {
    return next(error)
  }
}