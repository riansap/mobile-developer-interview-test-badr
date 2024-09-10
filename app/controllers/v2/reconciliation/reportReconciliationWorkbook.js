import Excel from 'exceljs'
import { numToSSColumn } from '../../../helpers/common'

export const reportReconciliationWorkbook = async ({
  list, intervalPeriod, year, entity, province, regency, activity, req
}) => {
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
    const title = req.__('report_header.recon_entity.filename')
    const worksheet = workbook.addWorksheet(title, {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: title, firstFooter: title },
    })
    const adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }

      const finalRow = intervalPeriod.length + 4
      const titleCells = [`A1:${numToSSColumn(finalRow)}1`]

      titleCells.forEach((cell) => {
        worksheet.mergeCells(cell)
        worksheet.getCell(cell).alignment = alignmentCenter
        worksheet.getCell(cell).font = {
          name: 'Calibri', family: 4, size: 11, bold: true,
        }
      })
    }

    worksheet.addRow([title])

    let activityName = activity?.name || req.__('report_header.recon_entity.all_activity')
    const fullPeriod = `${intervalPeriod[0]} - ${intervalPeriod[intervalPeriod.length - 1]}`
    worksheet.addRow([req.__('year'), year, '', '', '', '', req.__('province'), province?.name])
    worksheet.addRow([req.__('month'), fullPeriod, '', '', '', '', req.__('city'), regency?.name])
    worksheet.addRow([req.__('report_header.recon_entity.entity'), entity?.name])
    worksheet.addRow([req.__('report_header.recon_entity.activity'), activityName])
    worksheet.addRow([''])
    worksheet.addRow([''])

    const titleRow = [
      'No', req.__('report_header.recon_entity.entity_name'),
    ]
    intervalPeriod.forEach((period) => titleRow.push(period))

    worksheet.addRow([...titleRow, req.__('report_header.recon_entity.total_freq'), req.__('report_header.recon_entity.average_freq')])

    list.forEach((data, idx) => {
      const resultData = [
        idx + 1,
        data.name || '',
      ]
      Object.keys(data.overview).forEach((key) => {
        resultData.push(data.overview[key])
      })
      worksheet.addRow([
        ...resultData,
        data.total_frequency,
        data.average_frequency,
      ])
    })
    adjustCell()
    return workbook
  } catch (err) {
    console.log(err)
    throw Error(err)
  }
}
