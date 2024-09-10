import { Op } from 'sequelize'

import models from '../models'
import { USER_ROLE } from '../helpers/constants'
import moment from 'moment'

export function list(req, res, next) {
  const { user } = req
  const { province_id, regency_id, entity_id, created_at, type, entity_tag_ids } = req.query

  req.include = [
    {
      association: 'user',
      on: {
        user_id: models.Sequelize.literal('`Notification`.`user_id` = `user`.`id`')
      },
      attributes: ['id', 'username', 'firstname', 'lastname', 'role', 'entity_id'],
      required: false,
      paranoid: false,
    },
    {
      association: 'entity',
      on: {
        entity_id: models.Sequelize.literal('`Notification`.`entity_id` = `entity`. `id`')
      },
      attributes: ['id', 'name'],
      required: true,
    },
    {
      association: 'patient',
      on: {
        patient_id: models.Sequelize.literal('`Notification`.`patient_id` = `patient`.`id`')
      },
      attributes: ['id', 'nik', 'stop_notification', 'nik_visible']
    }
  ]
  const condition = []
  let userId = user.id
  if (province_id) condition.push({ province_id })
  if (regency_id) condition.push({ regency_id })
  if (entity_id) condition.push({ entity_id })
  if (created_at) {
    condition.push({
      created_at: {
        [Op.between]: [
          `${created_at} 00:00:00`,
          `${created_at} 23:59:59`
        ]
      }
    })
  }
  if (type) condition.push({ type })
  if (user.role === USER_ROLE.MANAGER || user.role === USER_ROLE.MANAGER_COVID) {
    if (province_id || regency_id) {
      userId = null
      if (!created_at) {
        condition.push({
          created_at: {
            [Op.between]: [
              moment(new Date()).subtract(7, 'days').format('YYYY-MM-DD') + ' 00:00:00',
              moment(new Date()).format('YYYY-MM-DD') + ' 23:59:59'
            ]
          }
        })
      }
    }
  } else if (user.role === USER_ROLE.SUPERADMIN) {
    userId = null
    if (!created_at) {
      condition.push({
        created_at: {
          [Op.between]: [
            moment(new Date()).subtract(7, 'days').format('YYYY-MM-DD') + ' 00:00:00',
            moment(new Date()).format('YYYY-MM-DD') + ' 23:59:59'
          ]
        }
      })
    }
  }
  if (entity_tag_ids) {
    const arrEntityTags = entity_tag_ids.split(',')
    req.include[1].include = {
      association: 'entity_tags',
      where: {
        id: { [Op.in]: arrEntityTags }
      },
      required: true
    }
  }
  if (userId) condition.push({ user_id: userId })
  req.condition = condition

  req.order = [['id', 'DESC']]

  next()
}

export async function countNotif(req, res, next) {
  try {
    const { id } = req.user
    const unread = await models.Notification.count({
      where: {
        user_id: id,
        read_at: null
      }
    })

    return res.status(200).json({
      unread
    })
  } catch (err) {
    next(err)
  }
}

export async function read(req, res, next) {
  try {
    const { id } = req.params
    const { user } = req
    models.Notification.update({
      read_at: new Date
    },
      {
        where: {
          id: id,
          user_id: user.id,
          read_at: null
        }
      })

    return res.status(200).json({
      message: 'Success'
    })
  } catch (err) {
    next(err)
  }
}

export async function bulkRead(req, res, next) {
  try {
    const { id } = req.user
    models.Notification.update({
      read_at: new Date
    },
      {
        where: {
          user_id: id,
          read_at: null
        }
      })

    return res.status(200).json({
      message: 'Success'
    })
  } catch (err) {
    next(err)
  }
}

export async function stopNotifPatient(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const {
      patient_id, reason_id, stop_status = 1
    } = req.body

    const dataHistory = {
      patient_id, reason_id, stop_status,
      created_by: req?.user?.id,
      updated_by: req?.user?.id
    }

    await models.StopNotificationHistory.create(dataHistory, { transaction: t })
    const patient = await models.Patient.findByPk(patient_id)
    patient.stop_notification = stop_status
    await patient.save({ transaction: t })

    await t.commit()

    return res.status(200).json({
      message: 'Success'
    })

  } catch (err) {
    await t.rollback()
    next(err)
  }
}

export function listStopHistories(req, res, next) {
  const { reason_id, patient_id } = req.query

  req.include = [
    {
      association: 'patient',
      attributes: ['id', 'nik', 'stop_notification', 'nik_visible']
    },
    {
      association: 'reason'
    },
    {
      association: 'user_created',
      attributes: ['id', 'firstname', 'lastname']
    },
    {
      association: 'user_updated',
      attributes: ['id', 'firstname', 'lastname']
    }
  ]
  const condition = []

  if(patient_id)
    condition.push({patient_id: patient_id.split(',').map(it=> Number(it.trim()))})

  if(reason_id)
    condition.push({reason_id: reason_id.split(',').map(it=> Number(it.trim()))})

  req.condition = condition

  req.order = [['id', 'DESC']]

  next()
}

