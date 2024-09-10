import Excel from 'exceljs'
import stream from 'stream'
import moment from 'moment'
import models from '../../models'
import { Op } from 'sequelize'
const userAttribtues = ['id', 'username', 'email', 'firstname', 'lastname']

const { OpnamePeriod } = models

function opnamePeriodAssociation(req, res, next) {
  req.include = [
    { association: 'user_created_by', attributes: userAttribtues },
    { association: 'user_updated_by', attributes: userAttribtues },
  ]
  next()
}

function list(req, res, next) {
  const condition = {}
  const { status, start_date, end_date } = req.query
  if (status) {
    condition['status'] = status
  }

  const startDate = moment(start_date, 'YYYY-MM-DD').startOf('day')
  const endDate = moment(end_date, 'YYYY-MM-DD').endOf('day')

  if (start_date) {
    condition['start_date'] = { [Op.between]: [startDate, endDate] }
  }

  req.condition = condition
  req.order = [['year_periode', 'desc'], ['month_periode', 'desc']]

  req.mappingDocs = function({docs, req}){
    let items = []
    for(let item of docs){
      let month = item.month_periode ? req.__(`months.${item.month_periode}`) + ' ' : ''
      let year = item.year_periode || ''
      let periode_data = `${month}${year}`

      items.push({
        ...item.dataValues,
        periode_data
      })
    }

    return items
  }

  opnamePeriodAssociation(req, res, next)
}

async function updateAllStatusPeriod(req, res, next) {
  const { status } = req.body
  const { id } = req.params
  if (id) {
    const data = await OpnamePeriod.findByPk(id)
    if (!data) {
      return res.status(404).json({ message: req.__('validator.not_exist', { field: 'Opname Period' }) })
    }
  }

  if (Number(status) === 1) {
    await OpnamePeriod.update({ status: 0 }, {
      where: { status: 1 }
    })
  }

  next()
}

async function updateStatus(req, res, next) {
  const { id } = req.params
  const { status = 0 } = req.body

  await OpnamePeriod.update({ status }, { where: { id } })
  const data = await OpnamePeriod.findByPk(id)

  return res.status(200).json(data)
}

function newExcel(data, lang = () => {}) {
  const workbook = new Excel.Workbook()

  workbook.creator = 'SMILE'
  workbook.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 1,
      visibility: 'visible',
    },
  ]
    
  const title = 'Opname Period'
  const worksheet = workbook.addWorksheet(title, {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: { firstHeader: title, firstFooter: title },
  })
    
  const titleRow = [
    lang('field.opname_period.periode_data'),
    lang('field.opname_period.start_date'),
    lang('field.opname_period.end_date'),
    lang('field.opname_period.status'),
    lang('custom.created_at'),
    lang('custom.updated_at'),
    lang('custom.created_by'),
    lang('custom.updated_by')
  ]
  worksheet.addRow(titleRow)

  if (Array.isArray(data) && data.length > 0) {
    data.forEach(item => {
      worksheet.addRow([
        item.periode_data,
        item.start_date,
        item.end_date,
        Number(item.status) === 0 ? lang('custom.non_active') : lang('custom.active'),
        item.created_at,
        item.updated_at,
        item?.user_created_by?.username,
        item?.user_updated_by?.username,
      ])
    })
  }

  return workbook
}

async function exportXLS(req, res, next) {
  const { condition, order, include, mappingDocs } = req
  let data = await OpnamePeriod.findAll({
    where: condition,
    include,
    order
  })

  data = await mappingDocs({ docs: data, req })

  const excel = newExcel(data, req.__)

  const timestamp = Date()
  const filename = `Opname Period (${timestamp})`

  const arrayBuffer = await excel.xlsx.writeBuffer()
  const readStream = new stream.PassThrough()
  readStream.end(arrayBuffer)

  res.writeHead(200, {
    'Content-Length': arrayBuffer.length,
    'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    'Access-Control-Expose-Headers': 'Filename',
    Filename: `${filename}.xlsx`,
  })

  return readStream.pipe(res)
}

export default {
  opnamePeriodAssociation,
  updateAllStatusPeriod,
  updateStatus,
  list,
  exportXLS
}