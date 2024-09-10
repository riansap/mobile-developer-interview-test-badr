import models from '../models'
import path from 'path'
import fs from 'fs'
import { validationSchema } from '../helpers/xls/xlsValidationSchema'
import Excel from 'exceljs'
import stream from 'stream'
import { getMaterialIDFromMasterMaterialAndActivity } from '../helpers/masterMaterialHelper'
import moment from 'moment'
import { KFA_LEVEL_CODE_TO_ID } from '../helpers/constants'

const { sequelize } = models

const readXlsxFile = require('read-excel-file/node')

export async function uploadXLS(req, res, next) {
  const { model, file, schema, dataMultivalues, dbValidation, dataValidation, additionalValue, insertOptions = {}, masterMaterialMapping = false } = req
  const { kfa, kfa_level } = req.body
  const rules = { schema, dbValidation, dataMultivalues, dataValidation }

  if (file === undefined) {
    return res.status(400).send('Please upload an excel file!')
  }
  let fullpath = path.join(__dirname, '../../resources/uploads/') + file.filename
  try {
    let origin = file.originalname

    let Model = null
    if (typeof model === 'string') Model = models[model]
    const rows = await readXlsxFile(fullpath, { sheet: 1 }).then((row) => {
      return row
    })
    const title = rows[0]
    if (!rows[1] || rows[1].length == 0) {
      throw Error('Upload file failed, empty row data')
    }

    let errors = []
    let datas = []
    for (let i = 1; i < rows.length; i++) {
      let newData = {}
      for (let j = 0; j < title.length; j++) {
        newData[title[j]] = rows[i][j] === 'NULL' ? null : rows[i][j]
      }
      if (additionalValue && Array.isArray(additionalValue)) {
        additionalValue.forEach((item) => {
          newData[item.title] = item.value
        })
      }

      const { error } = await validationSchema(newData, rules, datas)
      if (error) {
        errors.push({ 0: error.message + ' at row ' + i })
      }

      // Mapping Master Material
      if (masterMaterialMapping) {
        let masterMaterialIdx = title.findIndex((el) => el === 'master_material_id')
        let activityIdx = title.findIndex((el) => el === 'activity_id')
        if (rows[i][masterMaterialIdx] && rows[i][activityIdx]) {
          newData['material_id'] = await getMaterialIDFromMasterMaterialAndActivity({
            master_material_id: rows[i][masterMaterialIdx],
            activity_id: rows[i][activityIdx],
          })
        }
      }

      if (!error) {
        newData['created_by'] = req.user.id
        newData['updated_by'] = req.user.id
        
        if (kfa) {
          newData['code'] = newData['kfa_code']
          newData['kfa_level_id'] = KFA_LEVEL_CODE_TO_ID[kfa_level]
        }

        if (Array.isArray(req.include) && req.include.length > 0) {
          for (let assoc of req.include) {
            if (newData[assoc['association']])
              newData[assoc['association']] = newData[assoc['association']].toString().split(',')
          }
        }
        datas.push(newData)
      }
    }

    if (errors.length > 0) {
      await fs.unlinkSync(fullpath)
      return res.status(422).json({ errors: errors })
    }
    if (req.customValidation && typeof req.customValidation === 'function') {
      let { customValidation } = req
      await customValidation({ datas, req })
    }
    let options = { ...insertOptions, return: true }
    await sequelize.transaction(async (t) => {
      if (typeof req.beforeInsert === 'function') {
        await req.beforeInsert()
      }
      let data = await Model.bulkCreate(datas, options, { transaction: t })

      // set association
      if (typeof req.mappingRelations === 'function') {
        data = req.mappingRelations(data, datas)
      }

      return data
    })

    await fs.unlinkSync(fullpath)
    return res.status(200).json({
      message: 'Uploaded the file successfully: ' + origin,
    })
  } catch (error) {
    // delete temp file
    await fs.unlinkSync(fullpath)
    console.log(error)
    return next(error)
  }
}

export async function downloadTemplate(req, res, next) {
  try {
    let { filename } = req.params

    let fullpath = path.join(__dirname, `../../resources/template/${filename}.xlsx`)
    return res.download(fullpath)
  } catch (err) {
    return next(err)
  }
}

export async function prepareWorkbookFromModel(req) {
  const workbook = new Excel.Workbook()

  const {
    model,
    condition = {},
    attributes,
    order,
    include,
    customOptions,
    xlsColumns,
    mappingContents
  } = req

  const options = {
    order,
    attributes,
    where: condition,
    ...customOptions,
    duplicating: false,
    subQuery: false
  }

  if (include && typeof include === 'object') options.include = include

  let Model = null
  if (typeof model === 'function') Model = model
  else if (typeof model === 'string') Model = models[model]

  let data = await Model.findAll(options)

  workbook.creator = 'SMILE'
  workbook.views = viewsOptions

  const worksheet = workbook.addWorksheet(model, {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: { firstHeader: model, firstFooter: model }
  })

  const keyColumn = xlsColumns.map(item => { return { key: item.key } })
  worksheet.columns = keyColumn

  const titleColumns = xlsColumns.map(item => {
    if (item.title) return item.title
    return item.key
  })

  worksheet.addRow(titleColumns)

  for (let i = 0; i < data.length; i++) {
    let content = data[i]

    if (typeof req.mappingContents === 'function') {
      let mappingResult = {}
      if (content.order_stocks) {
        if (content.order_stocks.length > 0) {
          for (let stock of content.order_stocks) {
            //let stock = content.order_stocks[index]
            content.batch_name = stock?.stock?.batch?.code || ''
            content.batch_expired_date = stock?.stock?.batch?.expired_date || ''
            content.quantity_per_batch = stock?.stock?.batch ? stock.allocated_qty : ''

            if (stock.order_stock_exterminations) {
              if (stock.order_stock_exterminations.length > 0) {
                for (let index = 0; index < stock.order_stock_exterminations.length; index++) {
                  let exter = stock.order_stock_exterminations[index]
                  content.reason_discard = exter?.stock_extermination?.transaction_reason?.title || ''
                  content.extermination_discard_qty = exter?.allocated_discard_qty || ''
                  content.extermination_received_qty = exter?.allocated_received_qty || ''
                  mappingResult = await mappingContents({ data: content, req, index })
                  worksheet.addRow(mappingResult)
                }
              } else {
                mappingResult = await mappingContents({ data: content, req })
                worksheet.addRow(mappingResult)
              }
            } else {
              mappingResult = await mappingContents({ data: content, req, index })
              worksheet.addRow(mappingResult)
            }
          }
        } else {
          mappingResult = await mappingContents({ data: content, req })
          worksheet.addRow( mappingResult)
        }
      } else {
        mappingResult = await mappingContents({ data: content, req })
        worksheet.addRow(mappingResult)
      }

    } else {
      worksheet.addRow(content)
    }
  }

  return workbook
}

const viewsOptions = [
  {
    x: 0, y: 0, width: 10000, height: 20000,
    firstSheet: 0, activeTab: 1, visibility: 'visible'
  }
]

export async function downloadData(req, res, next) {
  try {
    const {
      model
    } = req

    const workbook = req.workbook ? await req.workbook(req) : await prepareWorkbookFromModel(req)

    const formatDate = moment().format('MM-DD-YYYY HH_mm_ss') + ' GMT' + moment().format('ZZ')

    let filename = `${model} ${formatDate}`
    if (req.xlsFilename) {
      filename = req.xlsFilename
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer()
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
