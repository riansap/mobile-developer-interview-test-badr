/* eslint-disable no-case-declarations */
import stream from 'stream'
import Excel from 'exceljs'

import models from '../../../models'
import { getYearlyPlan } from '../../yearlyResultController'

async function formatResult({ yearly_plan, master_material_id = null, entity_id = null, activity_id = null }) {
  const results = []
  let childResultOption = {}
  let childResultWhere = []
  if(master_material_id) childResultWhere.push({ master_material_id })
  if(activity_id) childResultWhere.push({ activity_id })
  if(childResultWhere.length > 0) childResultOption = { where: childResultWhere }

  let yearlyChildOptions = {} 
  if(entity_id) yearlyChildOptions = { entity_id }
  
  const yearlyResults = await models.YearlyChildResult.findAll({
    ...childResultOption,
    include: [
      {
        association: 'yearly_child',
        where: {
          yearly_plan_id: yearly_plan.id,
          ...yearlyChildOptions
        },
        include: [{
          association: 'entity',
          attributes: models.Entity.getBasicAttribute(),
          include: {
            association: 'sub_district',
            attributes: ['id', 'name']
          }
        }]
      },
      {
        association: 'master_material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        required: true,
      },
      {
        association: 'activity',
        attributes: models.MasterActivity.getBasicAttribute(),
        required: true,
      },
      {
        association: 'user_updated_by',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      }
    ],
    order: [['master_material_id', 'ASC']]
  })
  
  for(let result of yearlyResults) {
    // child
    let { id, monthly_need, weekly_need, ipv } = result
    let monthlyDistribution = []
    for(let month = 1; month <= 12; month++) {
      let date = new Date(2021, month-1)
      monthlyDistribution.push({
        month,
        name: date.toLocaleString('default', { month: 'short' }),
        monthly_need: monthly_need + weekly_need
      })
    }
    let customDistribution = JSON.parse(result.monthly_distribution)
    customDistribution.forEach(item => {
      monthlyDistribution[item.month-1].monthly_need = item.monthly_need
    })
    let data = {
      id, 
      material_id: result.master_material_id,
      activity_id: result.activity_id,
      yearly_child_id: result.yearly_child_id,
      regency: yearly_plan.regency,
      entity: result.yearly_child.entity,
      material: result.master_material,
      activity: result.activity,
      ipv: result.ipv,
      material_need: {
        yearly_need: result.yearly_need,
        monthly_need,
        weekly_need,
        min: weekly_need ?? 0,
        max: monthly_need + weekly_need,
        yearly_vial: result.yearly_vial,
        monthly_vial: result.monthly_vial,
        weekly_vial: result.weekly_vial,
      },
      monthly_distribution: monthlyDistribution,
      updated_by: result.updated_by,
      user_updated_by: result.user_updated_by,
      updated_at: result.updated_at,
      yearly_plan: yearly_plan.dataValues,
    }
    delete data['yearly_child']
    results.push(data)
  }

  return results
}

export async function detail(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const { master_material_id, entity_id, activity_id } = req.query

    const yearlyPlan = await getYearlyPlan(year, entity_regency_id)

    if(!yearlyPlan) {
      return res.status(422).json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    let result = await formatResult({ yearly_plan: yearlyPlan, master_material_id, entity_id, activity_id })
    return res.status(200).json(
      result
    )
  } catch(err) {
    return next(err)
  }
}

export async function exportExcel(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const yearlyPlan = await models.YearlyPlan.findOne({
      where: { entity_regency_id, year },
      include: {
        association: 'regency',
        attributes: ['id', 'name'],
        include: {
          association: 'province',
          attributes: ['id', 'name'],
        }
      }
    })

    let result = await formatResult({ yearly_plan: yearlyPlan })

    const material = []
    let oldMaterialID = null

    for(let item of result) {
      if(oldMaterialID !== item.material_id) {
        material.push({
          material: item.material,
          year: item.yearly_plan.year,
          regency_name: item.regency.name,
          province_name: item.regency.province?.name || '',
          results: [item]
        })
        oldMaterialID = item.material_id
      } else {
        let idx = material.findIndex(el => el.material.id === item.material_id)
        material[idx]['results'].push(item)
      }
    }

    const lang = req.headers['accept-language'] || 'id'

    const workbook = await yearlyPlanResultWorkbook(material, lang)
    
    const timestamp = Date()
    const filename = lang == 'en' ? `Calculated Results ${year}-${yearlyPlan.regency.name} (${timestamp})` : `Hasil perhitungan ${year}-${yearlyPlan.regency.name} (${timestamp})`

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
  } catch (error) {
    next(error)
  }
}

export const yearlyPlanResultWorkbook = async (data, lang = 'id') => {
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
        activeTab: 1,
        visibility: 'visible',
      },
    ]

    data.forEach((data) => {
      const { is_vaccine: isVaccine } = data.material
      // console.log(isVaccine)
      const worksheet = workbook.addWorksheet(data.material.name, {
        properties: { tabColor: { argb: 'FFC0000' } },
        headerFooter: { firstHeader: 'Report Transaction', firstFooter: 'Report Transaction' },
      })

      const _adjustCell = function () {
        const alignmentCenter = { vertical: 'middle', horizontal: 'center' }

        let titleCells = ['A1:P1', 'A2:P2', 'A3:P3', 'A5:A6', 'B5:B6', 'C5:C6', 'D5:D6', 'E5:E6', 'F5:J5', 'K5:V5']
        if (isVaccine) {
          titleCells = ['A1:P1', 'A2:P2', 'A3:P3', 'A5:A6', 'B5:B6', 'C5:C6', 'D5:D6', 'E5:E6', 'F5:M5', 'N5:Y5']
        }
        titleCells.forEach((cell) => {
          worksheet.mergeCells(cell)
          worksheet.getCell(cell).alignment = alignmentCenter
        })
      }

      const columnsWithTranslate = function(i, lang){
        let columns = [
          {
            id : [],
            en : []
          },
          {
            id : [`HASIL PERHITUNGAN KEBUTUHAN VAKSIN TAHUN ${data.year}`, `${data.regency_name}, ${data.province_name || ''}`, `MATERIAL: ${data.material.name}`, '', 'No'],
            en : [`VACCINE NEEDS CALCULATION RESULTS OF ${data.year}`, `${data.regency_name}, ${data.province_name || ''}`, `MATERIAL: ${data.material.name}`, '', 'No']
          },
          {
            id : ['', '', '', '', 'Kabupaten Kota'],
            en : ['', '', '', '', 'City/District']
          },
          {
            id : ['', '', '', '', 'Puskesmas'],
            en : ['', '', '', '', 'Primary Health Care']
          },
          {
            id : ['', '', '', '', 'Kegiatan'],
            en : ['', '', '', '', 'Activity']
          },
          {
            id : ['', '', '', '', 'Indeks Pemakaian (IP)'],
            en : ['', '', '', '', 'Use Index']
          },
          {
            id : ['', '', '', '', `Kebutuhan ${data.material.name}`, '1 Tahun (vial)'],
            en : ['', '', '', '', `Needs ${data.material.name}`, '1 Year (vial)']
          },
          {
            id : ['', '', '', '', '', '1 Tahun (dosis)'],
            en : ['', '', '', '', '', '1 Year (dose)']
          },
          {
            id : ['', '', '', '', '', '1 Bulan (vial)'],
            en : ['', '', '', '', '', '1 Month (vial)']
          },
          {
            id : ['', '', '', '', '', '1 Bulan (dosis)'],
            en : ['', '', '', '', '', '1 Month (dose)']
          },
          {
            id : ['', '', '', '', '', '1 Minggu (vial)'],
            en : ['', '', '', '', '', '1 Week (vial)']
          },
          {
            id : ['', '', '', '', '', '1 Minggu (dosis)'],
            en : ['', '', '', '', '', '1 Week (dose)']
          },
          {
            id : ['', '', '', '', '', 'Min (dosis)'],
            en : ['', '', '', '', '', 'Min (dose)']
          },
          {
            id : ['', '', '', '', '', 'Max (dosis)'],
            en : ['', '', '', '', '', 'Max (dose)']
          },
          {
            id : ['', '', '', '', 'DISTRIBUSI PER BULAN (dalam dosis)', 'Jan'],
            en : ['', '', '', '', 'MONTH DISTRIBUTION (dose)', 'Jan']
          },
          {
            id : ['', '', '', '', `Kebutuhan ${data.material.name}`, '1 Tahun'],
            en : ['', '', '', '', `Needs ${data.material.name}`, '1 Year']
          },
          {
            id : ['', '', '', '', '', '1 Bulan'],
            en : ['', '', '', '', '', '1 Month']
          },
          {
            id : ['', '', '', '', '', '1 Minggu'],
            en : ['', '', '', '', '', '1 Week']
          },
          {
            id : ['', '', '', '', '', 'Min'],
            en : ['', '', '', '', '', 'Min']
          },
          {
            id : ['', '', '', '', '', 'Max'],
            en : ['', '', '', '', '', 'Max']
          },
          {
            id : ['', '', '', '', 'DISTRIBUSI PER BULAN', 'Jan'],
            en : ['', '', '', '', 'MONTH DISTRIBUTION', 'Jan']
          }
        ]

        return columns[i][lang]
      }

      worksheet.getColumn(1).values = columnsWithTranslate(1, lang)
      worksheet.getColumn(2).values = columnsWithTranslate(2, lang)
      worksheet.getColumn(3).values = columnsWithTranslate(3, lang)
      worksheet.getColumn(4).values = columnsWithTranslate(4, lang)
      worksheet.getColumn(5).values = columnsWithTranslate(5, lang)

      if (isVaccine) {
        worksheet.getColumn(6).values = columnsWithTranslate(6, lang)
        worksheet.getColumn(7).values = columnsWithTranslate(7, lang)
        worksheet.getColumn(8).values = columnsWithTranslate(8, lang)
        worksheet.getColumn(9).values = columnsWithTranslate(9, lang)
        worksheet.getColumn(10).values = columnsWithTranslate(10, lang)
        worksheet.getColumn(11).values = columnsWithTranslate(11, lang)
        worksheet.getColumn(12).values = columnsWithTranslate(12, lang)
        worksheet.getColumn(13).values = columnsWithTranslate(13, lang)
        worksheet.getColumn(14).values = columnsWithTranslate(14, lang)
      } else {
        worksheet.getColumn(6).values = columnsWithTranslate(15, lang)
        worksheet.getColumn(7).values = columnsWithTranslate(16, lang)
        worksheet.getColumn(8).values = columnsWithTranslate(17, lang)
        worksheet.getColumn(9).values = columnsWithTranslate(18, lang)
        worksheet.getColumn(10).values = columnsWithTranslate(19, lang)
        worksheet.getColumn(11).values = columnsWithTranslate(20, lang)
      }

      let startCol = isVaccine ? 15 : 12
      for (let month = 2; month <= 12; month++) {
        const date = new Date(2021, month - 1)
        worksheet.getColumn(startCol).values = ['', '', '', '', '', date.toLocaleString('default', { month: 'short' })]
        startCol++
      }

      let idx = 1
      for (const resultItem of data.results) {
        let resultData = [
          idx,
          data.regency_name,
          resultItem.entity.name,
          resultItem.activity.name,
          resultItem.ipv,
          resultItem.material_need.yearly_need,
          resultItem.material_need.monthly_need,
          resultItem.material_need.weekly_need,
          resultItem.material_need.min,
          resultItem.material_need.max,
        ]

        if (isVaccine) {
          resultData = [
            idx,
            data.regency_name,
            resultItem.entity.name,
            resultItem.activity.name,
            resultItem.ipv,
            resultItem.material_need.yearly_vial,
            resultItem.material_need.yearly_need,
            resultItem.material_need.monthly_vial,
            resultItem.material_need.monthly_need,
            resultItem.material_need.weekly_vial,
            resultItem.material_need.weekly_need,
            resultItem.material_need.min,
            resultItem.material_need.max,
          ]
        }

        for (const monthlyDistribution of resultItem.monthly_distribution) {
          resultData.push(monthlyDistribution.monthly_need)
        }
        worksheet.addRow(
          resultData,
        )
        idx++
      }
      _adjustCell()
    })
    return workbook
  } catch (err) {
    console.log(err)
  }
}
