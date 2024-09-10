import { Op } from 'sequelize'
import stream from 'stream'
import moment from 'moment'
import Excel from 'exceljs'
import models from '../models'
import listResponse from '../helpers/listResponse'
import { formatRelationsCount } from '../helpers/common'

const {
  sequelizeIOT,
} = models

export function filter(req, res, next) {
  const { keyword, status } = req.query
  const condition = []
  if (keyword) condition.push({ code_pqs: {
    [Op.like]: `%${keyword}%`
  }})
  if (status) condition.push({ status })

  if (JSON.stringify(condition) !== '[]') req.condition = condition
  req.order = [['updated_at', 'DESC']]

  next()
}

export async function exportXls(req, res, next) {
  try {
    const { model, condition = {} } = req

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    const docs = await Model.findAll({ where: condition, duplicating: false })

    const workbook = new Excel.Workbook()
    workbook.creator = 'SMILE'

    const worksheet = workbook.addWorksheet('Coldchain Capacity Equipment', {
      properties: { tabColor: { argb: 'FFC0000' } },
    })
    // Tambahkan beberapa kolom dengan lebar yang ditentukan
    worksheet.columns = [
      { header: 'id', key: 'id', width: 10 },
      { header: 'Code PQS', key: 'code_pqs', width: 20 },
      { header: '+5°C', key: 'capacity_nett_at_plus_5_c', width: 20 },
      { header: '-20°C', key: 'capacity_nett_at_minus_20_c', width: 20 },
      { header: '-86°C', key: 'capacity_nett_at_minus_86_c', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
    ]
    for (const item of docs) {
      const dataValues = item.dataValues
      worksheet.addRow({
        ...dataValues,
        status: dataValues.status ? 'Active' : 'Inactive'
      })
    }
  
    const formatDate = moment().format('MM-DD-YYYY HH_mm_ss') + ' GMT' + moment().format('ZZ')
    const filename = `Coldchain Capacity Equipment ${formatDate}`

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    await workbook.xlsx.writeFile(filename + '.xlsx')
    const readStream = new stream.PassThrough()
    readStream.end(arrayBuffer)
    res.writeHead(200, {
      'Content-Length': arrayBuffer.length,
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      'Access-Control-Expose-Headers': 'Filename',
      'Filename': `${filename}.xlsx`
    })

    return readStream.pipe(res)

  } catch (err) {
    console.log(err)
    return next(err)
  }
}

export async function list(req, res, next) {
  try {
    let { page, paginate } = req.query
    if (!page || page === '') page = 1
    if (!paginate || paginate === '') paginate = 10

    
    const {
      model,
      condition = {},
      attributes,
      order,
      include,
      customOptions,
      isFormatRelationCount = true
    } = req
        
    const options = {
      order,
      attributes,
      limit: Number(paginate),
      offset: (page - 1) * Number(paginate),
      where: condition,
      duplicating: false,
      ...customOptions,
    }
    
    if (include && typeof include === 'object') options.include = include
    
    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]
    
    let docs = []
    let total = 10
    const { mappingDocs } = req
    
    if (Model) {
      docs = await Model.findAll(options)
      const countOptions = {
        ...options,
        include: isFormatRelationCount ? formatRelationsCount(options.include, condition) : options.include,
      }

      total = await Model.count({ ...countOptions, subQuery: false })

      if (typeof req.mappingDocs === 'function' && Array.isArray(docs)) {
        docs = await mappingDocs({ docs, req })
      }
    }

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    console.error(err, '===')
    return next(err)
  }
}

export async function create(req, res, next) {
  const t = await sequelizeIOT.transaction()
  try {
    const { model, user } = req

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    if (Model) {
      if (user) {
        req.body.created_by = user.id
        req.body.updated_by = user.id
      }
      delete req.body.id
      const options = { locale: req.getLocale(), subject: req.__('custom.user_created') }
      data = await Model.create(req.body, options, { transaction: t })
    }

    await t.commit()

    data = await Model.findByPk(data.id)

    return res.status(201).json(data)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function update(req, res, next) {
  const t = await sequelizeIOT.transaction()

  try {
    const { id } = req.params
    const { model, user } = req

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    if (Model) {
      if (user) {
        req.body.updated_by = user.id
      }
      delete req.body.id
      data = await Model.findByPk(id)
      if (!data) throw { status: 404, message: req.__('404') }
      data = await data.update(req.body, { transaction: t })
    }

    await t.commit()

    data = await Model.findByPk(data.id)

    return res.status(200).json(data)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function destroy(req, res, next) {
  const t = await sequelizeIOT.transaction()

  try {
    const { id } = req.params
    const { model, user } = req
    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    if (Model) {
      if (user) {
        req.body.deleted_by = user.id
      }
      data = await Model.findByPk(id)
      if (!data) throw { status: 404, message: req.__('404') }
      await data.update(req.body, { transaction: t })
      await data.destroy({ transaction: t })
    }

    await t.commit()

    return res.status(200).json({ message: 'success' })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    const { id } = req.params
    const { model, include, customOptions } = req
    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    let options = { ...customOptions }
    if (Model) {
      if (include && typeof include === 'object') options.include = include
      data = await Model.findByPk(id, options)
      if (!data) throw { status: 404, message: req.__('404') }
      if (typeof req.mappingData === 'function') {
        data = req.mappingData({ data, req })
      }
    }

    return res.status(200).json(data)
  } catch (err) {
    console.log(err)
    return next(err)
  }
}