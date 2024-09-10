import moment from 'moment'
import stream from 'stream'
import { Op } from 'sequelize'

import models from '../../../models'
import { leadZeroNumber, formatDecimal } from '../../../helpers/common'
import { STATUS } from '../../../helpers/constants'
import { reportReconciliationWorkbook } from './reportReconciliationWorkbook'

const { sequelize } = models

let LANG = 'id'

function getMonthName(integer) {
  // get format month from integer, start from 0 = Jan
  moment.locale(LANG)
  return moment({ month: integer - 1 }).format('MMMM')
}

function getReconCondition(params) {
  let {
    year, start_date, end_date, entity_id, activity_id
  } = params
  if (!year) year = moment().format('YYYY')

  const condition = []
  let startDate = `${year}-01-01`
  let endDate = `${year}-12-31`
  if (start_date) startDate = start_date
  if (end_date) endDate = end_date

  if (entity_id) condition.push({ entity_id })
  if (activity_id) condition.push({ activity_id })
  condition.push({ created_at: { [Op.between]: [startDate, endDate] } })

  const months = []
  const startMonth = parseInt(moment(startDate).format('M'))
  const endMonth = parseInt(moment(endDate).format('M'))
  for (let i = startMonth; i <= endMonth; i++) {
    months.push(i)
  }
  // startDate endDate
  return { condition, months, year }
}

function getEntityOptions(params) {
  const {
    province_id, regency_id, entity_id,
  } = params
  let { entity_tag_ids } = params

  const include = []
  const condition = [{ is_vendor: 1 }, { status: STATUS.ACTIVE }]
  if (province_id) condition.push({ province_id })
  if (regency_id) condition.push({ regency_id })
  if (entity_id) condition.push({ id: entity_id })
  if (entity_tag_ids) {
    entity_tag_ids = entity_tag_ids.split(',')
    include.push({
      association: 'entity_tags',
      where: {
        id: { [Op.in]: entity_tag_ids },
      },
    })
  }
  return { where: condition, include }
}

function formatListEntityRecon({ entities, reconciliations, months }) {
  // reconciliations
  const overviews = {}
  const intervalPeriod = []
  months.forEach((month) => {
    const formatMonth = getMonthName(month)
    overviews[formatMonth] = 0
    intervalPeriod.push(formatMonth)
  })

  const listEntity = []
  entities.forEach((entity) => {
    const overviewPerEntity = JSON.parse(JSON.stringify(overviews))
    // parse reconciliations to overview
    let total = 0
    reconciliations.filter((el) => el.entity_id === entity.id)
      .forEach((el) => {
        total += el.value
        overviewPerEntity[getMonthName(el.month)] = el.value ?? 0
      })

    listEntity.push({
      id: entity.id,
      name: entity.name,
      total_frequency: total,
      average_frequency: formatDecimal(total / months.length),
      overview: overviewPerEntity,
    })
  })
  return {
    list: listEntity,
    intervalPeriod,
  }
}

function formatBarData({ reconByMonth, year, months }) {
  const intervalPeriod = []
  const column = []
  const overview = []
  months.forEach((i) => {
    const month = leadZeroNumber(i)
    const data = reconByMonth.find((el) => moment(el.created_at).format('MM') === month)

    const label = `${year}-${month}`
    const col = moment(label).format('MMM YYYY')

    intervalPeriod.push(label)
    column.push({ label: col })
    overview.push({
      label,
      value: data?.dataValues?.value || 0,
    })
  })

  return {
    intervalPeriod,
    overview,
    column,
    subColumn: ['value'],
  }
}

async function queryReportReconciliationByEntity(options) {
  const reportByEntity = await models.Reconciliation.findAll({
    attributes: [
      'entity_id',
      'created_at',
      [sequelize.fn('Month', sequelize.literal('`Reconciliation`.`created_at`')), 'month'],
      [sequelize.fn('Year', sequelize.literal('`Reconciliation`.`created_at`')), 'year'],
      [sequelize.fn('COUNT', '*'), 'value'],
    ],
    ...options,
    without_relations: true,
    group: ['month', 'entity_id'],
    raw: true,
  })
  return reportByEntity
}

async function queryReportReconciliationByMonth(options) {
  const reportByMonth = await models.Reconciliation.findAll({
    attributes: [
      'created_at',
      [sequelize.fn('Month', sequelize.literal('`Reconciliation`.`created_at`')), 'month'],
      [sequelize.fn('Year', sequelize.literal('`Reconciliation`.`created_at`')), 'year'],
      [sequelize.fn('COUNT', '*'), 'value'],
    ],
    ...options,
    group: [['month']],
    without_relations: true,
  })
  return reportByMonth
}

export async function entityReport(req, res, next) {
  try {
    const {
      page = 1, paginate = 10,
    } = req.query

    const entityOptions = getEntityOptions(req.query)
    const entities = await models.Entity.findAll({
      ...entityOptions,
      limit: Number(paginate),
      offset: (page - 1) * Number(paginate),
    })
    const total = await models.Entity.count(entityOptions)

    const { condition: reconciliationCondition, months } = getReconCondition(req.query)
    const reconciliations = await queryReportReconciliationByEntity({ where: reconciliationCondition })

    const { list, intervalPeriod } = formatListEntityRecon({ entities, reconciliations, months })
    const data = {
      month: '',
      intervalPeriod,
      total,
      page,
      perPage: paginate,
      list,
    }

    return res.json(data)
  } catch (err) {
    return next(err)
  }
}

export async function barReport(req, res, next) {
  try {
    const { condition, year, months } = getReconCondition(req.query)

    const entityOptions = getEntityOptions(req.query)

    const reconByMonth = await queryReportReconciliationByMonth({
      where: condition,
      include: [{
        association: 'entity',
        ...entityOptions,
      }],
    })

    const data = formatBarData({ reconByMonth, year, months })

    return res.json(data)
  } catch (err) {
    return next(err)
  }
}

export async function entityReportXLS(req, res, next) {
  try {
    LANG = req.headers['accept-language'] || 'id'
    const { province_id, regency_id, entity_id, activity_id } = req.query
    let province = null
    let regency = null
    let entity = null
    let activity = null
    if (province_id) province = await models.Province.findByPk(province_id)
    if (regency_id) regency = await models.Regency.findByPk(regency_id)
    if (entity_id) entity = await models.Entity.findByPk(entity_id, { include: [] })
    if (activity_id) activity = await models.MasterActivity.findByPk(activity_id)

    const entityOptions = getEntityOptions(req.query)
    const entities = await models.Entity.findAll(entityOptions)

    const { condition: reconCondition, months, year } = getReconCondition(req.query)
    const reconciliations = await queryReportReconciliationByEntity({
      where: reconCondition,
      include: [{
        association: 'entity',
        ...entityOptions,
      }],
    })

    const formatList = formatListEntityRecon({ entities, reconciliations, months })

    const workbook = await reportReconciliationWorkbook({
      ...formatList,
      year,
      province,
      regency,
      entity,
      activity,
      req
    })

    const timestamp = Date()
    const filename = `${req.__('report_header.recon_entity.filename')} (${timestamp})`

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
