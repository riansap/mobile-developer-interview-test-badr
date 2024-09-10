//import { Op } from 'sequelize'
import models from '../models'
import { formatRelationsCount } from '../helpers/common'
//import { commonLists } from '../helpers/xls/excelTemplate'
import listResponse from '../helpers/listResponse'
//import moment from 'moment'
import stream from 'stream'
import { Op } from 'sequelize'
import Excel from 'exceljs'

import path from 'path'
import fs from 'fs'
import { validationSchema } from '../helpers/xls/xlsValidationSchema'

const readXlsxFile = require('read-excel-file/node')

const {
  sequelize
} = models

export async function filter(req, res, next) {
  try {
    const condition = []
    const materialCondition = []
    let {
      master_material_id,
      manufacture_id,
      keyword,
      activity_id,
      is_vaccine
    } = req.query

    if (master_material_id) condition.push({ master_material_id })
    if (manufacture_id) condition.push({ manufacture_id })
    if (keyword) materialCondition.push({ name: { [Op.like]: `%${keyword}%` } })
    if (!(is_vaccine === undefined || is_vaccine === null || is_vaccine === '')) materialCondition.push({ is_vaccine })

    req.include = [
      {
        association: 'master_material',
        attributes: ['id', 'name', 'unit', 'pieces_per_unit', 'is_vaccine'],
        where: materialCondition,
        required: true
      },
      {
        association: 'manufacture',
        attributes: ['id', 'name', 'type', 'is_asset']
      },
      {
        association: 'user_updated_by',
        attributes: ['id', 'username', 'firstname', 'lastname']
      }
    ]

    if (activity_id) {
      req.include[0].include = {
        association: 'material_activities',
        attributes: ['id', 'name'],
        through: { attributes: [] },
        where: { id: activity_id }
      }
    }

    req.condition = condition

    req.order = [['updated_at', 'desc']]

    return next()

  } catch (error) {
    return next(error)
  }
}

export async function customList(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const { condition = {}, include, order } = req

    const options = {
      order,
      limit: Number(paginate),
      offset: (Number(page) - 1) * Number(paginate),
      where: condition,
      duplicating: false,
      subQuery: false
    }

    if (include && typeof include === 'object') options.include = include

    let docs = []
    let total = 10

    docs = await models.MasterVolumeMaterialManufacture.findAll(options)
    const countOptions = {
      ...options,
      include: formatRelationsCount(options.include, condition),
    }

    //countOptions.include[0].include.shift()

    //console.log(countOptions)

    total = await models.MasterVolumeMaterialManufacture.count({ ...countOptions, subQuery: false })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    docs = docs.map((data) => {
      const { box_length, box_width, box_height } = data
      let dimension = Number((box_length * box_width * box_height).toFixed(3))

      return {
        ...data.dataValues,
        dimension
      }
    })

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (error) {
    console.log(error)
    return next(error)
  }
}

export async function detail(req, res, next) {
  const { id } = req.params

  const data = await models.MasterVolumeMaterialManufacture.findByPk(id, {
    include: [
      {
        association: 'master_material',
        attributes: ['id', 'name', 'unit', 'pieces_per_unit']
      },
      {
        association: 'manufacture',
        attributes: ['id', 'name', 'type', 'is_asset']
      },
      {
        association: 'user_updated_by',
        attributes: ['id', 'username', 'firstname', 'lastname']
      }
    ]
  })

  if (!data)
    return res.status(204).end(req.__('204'))
    //throw { status: 204, message: req.__('204') }

  const { box_length, box_width, box_height } = data
  let dimension = Number((box_length * box_width * box_height).toFixed(3))

  res.status(200).json({
    ...data.dataValues,
    dimension
  })
}

export async function create(req, res, next) {
  const t = await sequelize.transaction()
  try {
    let { body: data } = req

    data.created_by = req.user.id
    data.updated_by = req.user.id

    const volumeMaterial = await models.MasterVolumeMaterialManufacture.create(data, { transaction: t })

    await t.commit()
    const result = await models.MasterVolumeMaterialManufacture.findByPk(volumeMaterial.id)
    return res.status(201).json(result)
  } catch (err) {
    await t.rollback()
    next(err)
  }
}

export async function update(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params

    const volumeMaterial = await models.MasterVolumeMaterialManufacture.findByPk(id)

    if (!volumeMaterial) throw { status: 404, message: req.__('404') }

    const { master_material_id, manufacture_id, pieces_per_unit, unit_per_box, box_length, box_width, box_height } = req.body

    let data = {
      master_material_id, manufacture_id, pieces_per_unit, unit_per_box, box_length, box_width, box_height,
      updated_by: req.user.id
    }

    await volumeMaterial.update(data, { transaction: t })

    await t.commit()

    data = await models.MasterVolumeMaterialManufacture.findByPk(id)

    res.status(200).json(data)

  } catch (err) {
    console.log(err)
    await t.rollback()
    next(err)
  }
}

export async function destroy(req, res, next) {
  const t = await sequelize.transaction()


  try {
    const { id } = req.params

    const volumeMaterial = await models.MasterVolumeMaterialManufacture.findByPk(id)

    if (!volumeMaterial) throw { status: 404, message: req.__('404') }

    const colstorageMaterial = await models.ColdstorageMaterial.findOne({
      where: { master_material_id: volumeMaterial.master_material_id }
    })

    if (colstorageMaterial) throw { status: 422, message: req.__('validator.still_exist', { field1: req.__('field.id.material_id'), field2: req.__('coldstorage.id') }) }

    await volumeMaterial.update({ updated_by: req.user.id }, { transaction: t })
    await volumeMaterial.destroy({ transaction: t })

    await t.commit()
    return res.status(200).json({ message: 'success' })

  } catch (err) {
    await t.rollback()
    next(err)
  }
}


export async function excelTemplate(req, res, next) {
  try {
    const workbook = new Excel.Workbook()

    workbook.creator = 'SMILE'

    workbook.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: 0,
        visibility: 'visible',
      },
    ]

    const worksheetVolume = workbook.addWorksheet('Volume Material', {
      headerFooter: { firstHeader: 'Volume Material', firstFooter: 'Volume Material' }
    })

    const worksheetManufacture = workbook.addWorksheet('Manufacture', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Manufacture', firstFooter: 'Manufacture' },
    })


    const worksheetMaterial = workbook.addWorksheet('Master Material', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Material', firstFooter: 'Material' },
    })


    worksheetManufacture.addRow(['id', 'name', 'type', 'status'])
    worksheetMaterial.addRow(['id', 'name', 'pieces_per_unit', 'code', 'status'])

    const manufactures = await models.Manufacture.findAll({ attributes: ['id', 'name', 'type', 'status'], where: { type: 1 } })
    const materials = await models.MasterMaterial.findAll({ attributes: ['id', 'name', 'pieces_per_unit', 'code', 'status'] })

    worksheetVolume.addRow(['master_material_id', 'manufacture_id', 'pieces_per_unit', 'unit_per_box', 'box_length', 'box_width', 'box_height'])

    for (let item of manufactures)
      worksheetManufacture.addRow([item.id, item.name, item.type, (item.status == 1 ? 'Active' : 'Inactive')])
    for (let item of materials)
      worksheetMaterial.addRow([item.id, item.name, item.pieces_per_unit, item.code, (item.status == 1 ? 'Active' : 'Inactive')])


    const timestamp = Date()
    const filename = `Template Volume Material (${timestamp})`

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
  } catch (err) {
    throw Error(err)
  }
}

export async function exportExcel(req, res, next) {
  try {

    const { condition = {}, include, order } = req

    const options = {
      order,
      where: condition,
      duplicating: false,
      subQuery: false
    }

    if (include && typeof include === 'object') options.include = include

    let docs = []


    docs = await models.MasterVolumeMaterialManufacture.findAll(options)

    const workbook = new Excel.Workbook()

    workbook.creator = 'SMILE'

    workbook.views = [
      {
        x: 0,
        y: 0,
        width: 10000,
        height: 20000,
        firstSheet: 0,
        activeTab: 0,
        visibility: 'visible',
      },
    ]

    const worksheetVolume = workbook.addWorksheet('Volume Material', {
      headerFooter: { firstHeader: 'Volume Material', firstFooter: 'Volume Material' }
    })

    worksheetVolume.addRow([
      'No', 'Material ID', 'Material', 'Manufacture ID', 'Manufacture', 'Pieces per Unit', 'Unit per Box', 'Length (cm)',
      'Width (cm)', 'Height (cm)', 'Updated At', 'Updated By'
    ])

    for (let i = 0; i < docs.length; i++) {
      let item = docs[i]
      const { manufacture, master_material, user_updated_by } = item.dataValues
      worksheetVolume.addRow(
        [
          i + 1, item.master_material_id, master_material?.name || '', item.manufacture_id,
          manufacture?.name || '', item.pieces_per_unit, item.unit_per_box,
          item.box_length, item.box_width, item.box_height, item.updated_at,
          user_updated_by?.username || ''
        ]
      )
    }

    const timestamp = Date()
    const filename = `Volume Material Manufacture (${timestamp})`

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
    console.log(error)
    return next(error)
  }
}


export async function uploadXLS(req, res, next) {
  const t = await sequelize.transaction()

  const { file, schema, dbValidation, dataValidation } = req
  const rules = { schema, dbValidation, dataValidation }

  if (file == undefined) {
    return res.status(400).send('Please upload an excel file!')
  }

  let fullpath = path.join(__dirname, '../../resources/uploads/') + file.filename

  try {
    let origin = file.originalname
    let datas = []
    const rows = await readXlsxFile(fullpath, { sheet: 'Volume Material' }).then((rows) => {
      return rows
    })
    const title = rows[0]
    if (!rows[1] || rows[1].length == 0) {
      throw Error('Upload file failed, empty row data')
    }

    for (let i = 1; i < rows.length; i++) {
      let newData = {}
      for (let j = 0; j < title.length; j++) {
        newData[title[j]] = rows[i][j] === 'NULL' ? null : rows[i][j]
      }
      //console.log(schema)
      const { error } = await validationSchema(newData, rules, datas)

      if (error) {
        await t.rollback()
        await fs.unlinkSync(fullpath)
        return res.status(422).json({ message: error.message + ' at row ' + i })
      }

      let master_material_id = newData.master_material_id
      let manufacture_id = newData.manufacture_id

      if (datas.find(it => it.master_material_id == master_material_id && it.manufacture_id == manufacture_id)) {
        await t.rollback()
        await fs.unlinkSync(fullpath)
        return res.status(422).json({ message: 'Duplicate data master_material_id, manufacture_id at row ' + i })
      }

      let volumeMaterial = await models.MasterVolumeMaterialManufacture.findOne({ where: { master_material_id, manufacture_id } })

      if (volumeMaterial) {
        await t.rollback()
        await fs.unlinkSync(fullpath)
        return res.status(422).json({ message: 'Data material & manufacture is exists at row ' + i })
      }

      newData.created_by = req.user.id
      newData.updated_by = req.user.id

      datas.push(newData)

    }
    await models.MasterVolumeMaterialManufacture.bulkCreate(datas, { transaction: t })

    await t.commit()
    await fs.unlinkSync(fullpath)
    return res.status(200).json({
      message: 'Uploaded the file successfully: ' + origin,
    })
  } catch (err) {
    await t.rollback()
    await fs.unlinkSync(fullpath)
    return next(err)
  }
}

