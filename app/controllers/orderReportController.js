import { Op } from 'sequelize'
import moment from 'moment'
import { STATUS, USER_ROLE } from '../helpers/constants'
import { generateReportOrderNotif } from '../helpers/notifications/orderNotification'

import models from '../models'

export async function sendReport(req, res, next) {
  try {
    const { user } = req
    const arrayOfReport = req.body
    const admins = await models.User.findAll({
      where: [{
        role: {
          [Op.in]: [USER_ROLE.CONTACT_CENTER],
        },
      }, {
        status: STATUS.ACTIVE,
      }],
    })
    for (let i = 0; i < arrayOfReport.length; i++) {
      const {
        material_id,
        batch_code,
        batch_expired,
        batch_production,
      } = arrayOfReport[i]

      const material = await models.Material.findByPk(material_id)
      const entity = await models.Entity.findByPk(user.entity_id)
      const vendorIds = await entity.getVendors()
      const notif = {
        ...arrayOfReport[i],
        material,
        batch: { code: batch_code, expired_at: batch_expired, production_date: batch_production },
        user,
        entity,
        vendorIds,
      }
      await generateReportOrderNotif(notif, admins)
    }

    return res.status(200).json({ message: 'Laporan telah terkirim' })
  } catch (err) {
    return next(err)
  }
}

export async function list(req, res, next) {
  try {
    const {
      entity_id, material_id, created_at, message, keyword, province_id, regency_id,
    } = req.query
    let { from_date, to_date } = req.query
    const condition = []
    if (from_date) from_date = `${moment(from_date).format('YYYY-MM-DD')} 00:00:00`
    if (to_date) to_date = `${moment(to_date).format('YYYY-MM-DD')} 23:59:59`
    if (entity_id) {
      condition.push({ entity_id })
    }
    if (material_id) {
      condition.push({ material_id })
    }
    if (created_at) {
      condition.push({ created_at })
    } else {
      if (from_date) {
        condition.push({
          arrived_date: {
            [Op.gte]: from_date,
          },
        })
      }
      if (to_date) {
        condition.push({
          arrived_date: {
            [Op.lte]: to_date,
          },
        })
      }
    }
    if (message) {
      condition.push({ message: { [Op.like]: `%${message}%` } })
    }
    if (keyword) {
      condition.push({ batch_code: { [Op.like]: `%${keyword}%` } })
    }
    if (province_id) {
      condition.push({ '$entity.province_id$': province_id })
    }
    if (regency_id) {
      condition.push({ '$entity.regency_id$': regency_id })
    }
    if (condition.length) req.condition = condition

    req.include = [{
      association: 'entity',
      attributes: models.Entity.getBasicAttribute(),
      include: {
        association: 'province',
      },
    }, {
      association: 'material',
      attributes: models.Material.getBasicAttribute(),
    }]
    req.order = [['created_at', 'desc']]
    req.customOptions = { subQuery: false }

    req.xlsColumns = [
      { key: 'entity_name', title: 'Entitas Pelapor' },
      { key: 'province_name', title: 'Provinsi' },
      { key: 'material_name', title: 'Nama Material' },
      { key: 'arrived_date', title: 'Tanggal Kedatangan' },
      { key: 'batch_code', title: 'Nomor Batch' },
      { key: 'arrived_qty', title: 'Kuantitas' },
      { key: 'created_at', title: 'Tanggal Dilaporkan' },
    ]

    return next()
  } catch (error) {
    return next(error)
  }
}
