/* eslint-disable camelcase */
// import axios from 'axios'
import { Op } from 'sequelize'
import stream from 'stream'

import moment from 'moment'
import models from '../../models'
import { EVENT_REPORT_STATUS, USER_ROLE } from '../../helpers/constants'
import { eventReportWorkbook } from '../../helpers/xls/eventReportWorkbook'
import { flowStatusUpdate, getEventReportStatus } from '../../helpers/eventReportHelper'

const { sequelize } = models

export async function create(req, res, next) {
  const {
    entity_id, order_id, no_packing_slip, has_order, arrived_date,
  } = req.body
  let { items, comments } = req.body
  const { user } = req
  const t = await sequelize.transaction()
  try {
    // post

    const bodyCreate = {
      entity_id,
      order_id: parseInt(has_order) ? order_id : null,
      no_packing_slip: !parseInt(has_order) ? no_packing_slip : null,
      has_order,
      arrived_date,
      created_by: user.id,
      updated_by: user.id,
    }
    const createdEvent = await models.EventReport.create(bodyCreate,
      { transaction: t })
    items = items.map((el) => ({
      event_report_id: createdEvent.id,
      ...el,
    }))
    console.log(items)
    await models.EventReportItem.bulkCreate(items, { transaction: t })

    comments = comments.map((el) => ({
      event_report_id: createdEvent.id,
      comment: el.comment,
      user_id: user.id,
      status: EVENT_REPORT_STATUS.CREATE,
    }))
    await models.EventReportComment.bulkCreate(comments, { transaction: t })

    await t.commit()

    const resData = await models.EventReport.findByPk(createdEvent.id)
    return res.status(201).json(resData)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function updateStatus(req, res, next) {
  const t = await sequelize.transaction()
  try {
    const { user } = req
    const { id } = req.params
    const { status, comment } = req.body

    const eventReport = await models.EventReport.findByPk(id)
    if (!eventReport) return res.status(404)
    eventReport.status = status
    eventReport.updated_by = user.id
    if (status === EVENT_REPORT_STATUS.FINISH) eventReport.finished_at = new Date()
    if (status === EVENT_REPORT_STATUS.CANCEL) eventReport.canceled_at = new Date()
    await eventReport.save({ transaction: t })

    if (comment && status === EVENT_REPORT_STATUS.CANCEL) {
      await models.EventReportComment.create({
        event_report_id: eventReport.id,
        status,
        user_id: user.id,
        comment,
      }, { transaction: t })
    }

    await t.commit()
    return res.json({
      message: 'sukses',
    })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function updateLink(req, res, next) {
  const t = await sequelize.transaction()
  try {
    const { user } = req
    const { id } = req.params
    const { link } = req.body

    const eventReport = await models.EventReport.findByPk(id, {
      where: { status: EVENT_REPORT_STATUS.ON_CHECK_VCCM },
    })
    if (!eventReport) return res.status(404)
    eventReport.link = link
    eventReport.updated_by = user.id
    await eventReport.save({ transaction: t })

    await t.commit()
    return res.json({
      message: 'sukses',
    })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function reportStatuses(req, res, next) {
  try {
    const { entity_id } = req.query
    const condition = []
    if (entity_id) condition.push({ entity_id })

    const options = {}
    if (condition.length > 0) options.where = condition

    const data = []
    const allStatuses = await models.EventReport.count(options)
    const statusCounts = await models.EventReport.count({
      ...options,
      group: ['status'],
    })
    data.push({
      status: null,
      count: allStatuses,
      label: req.__('field.event_report_status.all'),
    })
    Object.keys(EVENT_REPORT_STATUS).forEach((objKey) => {
      data.push({
        status: EVENT_REPORT_STATUS[objKey],
        count: 0,
        label: getEventReportStatus(req, EVENT_REPORT_STATUS[objKey]),
      })
    })
    statusCounts.forEach((item) => {
      const statusIdx = data.findIndex((el) => el.status === item.status)
      if(statusIdx>=0)
        data[statusIdx].count = item.count
    })
    return res.json(data)
  } catch (err) {
    return next(err)
  }
}

export async function histories(req, res, next) {
  try {
    const { id } = req.params
    const eventReportHistories = await models.EventReportHistory.findAll({
      where: { event_report_id: id },
      attributes: [
        'id', 'event_report_id', 'status', 'updated_at', 'updated_by',
      ],
      include: {
        association: 'user_updated_by',
        attributes: ['id', 'firstname', 'lastname'],
      },
    })
    if (!eventReportHistories) return res.status(404)
    const resData = eventReportHistories.map((history) => ({
      ...history.dataValues,
      label: getEventReportStatus(req, history.status),
      // getEventReportLabel(history.status),
    }))

    return res.json(resData)
  } catch (err) {
    return next(err)
  }
}

export async function eventReportsFilter(req, res, next) {
  try {
    const {
      from_arrived_date,
      to_arrived_date,
      updated_at,
      order_id,
      entity_tag_ids,
      province_id,
      regency_id,
      no_packing_slip,
    } = req.query
    let { entity_id, status } = req.query

    const { user } = req
    const excludeRole = [
      USER_ROLE.SUPERADMIN,
      USER_ROLE.CONTACT_CENTER,
      USER_ROLE.MANAGER,
      USER_ROLE.MANAGER_COVID,
      USER_ROLE.ADMIN,
    ]
    if (!excludeRole.includes(user.role)) {
      entity_id = user.entity_id
    }

    const condition = []
    const filterFormat = 'YYYY-MM-DD'
    if (entity_id) condition.push({ entity_id })
    if (status) {
      status = status.split(',')
      condition.push({ status: { [Op.in]: status } })
    }
    if (order_id) condition.push({ order_id })
    if (updated_at) condition.push({ updated_at })
    if (no_packing_slip) condition.push({ no_packing_slip })
    if (from_arrived_date) {
      condition.push({ arrived_date: { [Op.gte]: `${moment(from_arrived_date).format(filterFormat)} 00:00:00` } })
    }
    if (to_arrived_date) {
      condition.push({ arrived_date: { [Op.lte]: `${moment(to_arrived_date).format(filterFormat)} 23:59:59` } })
    }

    const entityCondition = []
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })

    req.condition = condition
    req.include = await models.EventReport.getAssociation()

    const entityAssocIdx = req.include.findIndex((assoc) => assoc.association === 'entity')
    if (entityCondition.length > 0) {
      req.include[entityAssocIdx].where = entityCondition
    }
    if (entity_tag_ids) {
      const entityTagIds = entity_tag_ids.split(',')
      req.include[entityAssocIdx].include = {
        association: 'entity_tags',
        where: { id: { [Op.in]: entityTagIds } },
      }
    }
    req.order = [['id', 'DESC']]
    req.customOptions = { without_relations: true }

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function eventReportExcel(req, res, next) {
  try {
    const {
      order, attributes, condition, customOptions, include,
    } = req

    const options = {
      order,
      attributes,
      where: condition,
      ...customOptions,
      include,
    }
    const eventReports = await models.EventReport.findAll(options)

    const workbook = await eventReportWorkbook(eventReports)

    const timestamp = Date()
    const filename = `Laporkan Kejadian (${timestamp})`

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const readStream = new stream.PassThrough()
    readStream.end(arrayBuffer)
    res.writeHead(200, {
      'Content-Length': arrayBuffer.length,
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      'Access-Control-Expose-Headers': 'Filename',
      Filename: `${filename}.xlsx`,
    })

    return readStream.pipe(res)
  } catch (error) {
    return next(error)
  }
}

export async function listUpdateStatus(req, res, next) {
  const { user } = req
  const { id } = req.params
  try {
    const eventReport = await models.EventReport.findByPk(id, { without_relations: true })
    const listStatus = []
    if (!eventReport) return res.json([])

    if (user.role === (USER_ROLE.MANAGER_COVID || USER_ROLE.MANAGER)) {
      if (user.entity_id !== eventReport.entity_id) return res.json([])
    }

    const flow = flowStatusUpdate.find((el) => el.status === eventReport.status)
    if (flow && flow.nextStatus.length > 0) {
      // loop next status from flow
      flow.nextStatus.forEach((availableStatus) => {
        // check if role can update status
        const checkRole = flowStatusUpdate.find((e) => e.status === availableStatus)
        if (checkRole && checkRole.roles.indexOf(user.role) >= 0) {
          // check if role is manager && entity is same
          listStatus.push({
            status: availableStatus,
            label: getEventReportStatus(req, availableStatus),
            // label: getEventReportLabel(availableStatus),
          })
        }
      })
    }

    return res.json(listStatus)
  } catch (err) {
    return next(err)
  }
}
