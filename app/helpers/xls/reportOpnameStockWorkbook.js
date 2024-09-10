import Excel from 'exceljs'
import { numToSSColumn } from '../common'

export const reportOpnameStockWorkbook = async ({
  list, intervalPeriod, year, entity, province, regency,
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
    const title = 'Laporan Aktivitas Stock Opname'
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

    const fullPeriod = `${intervalPeriod[0]} - ${intervalPeriod[intervalPeriod.length - 1]}`
    worksheet.addRow(['Tahun', year, '', '', '', '', 'Provinsi', province?.name])
    worksheet.addRow(['Bulan', fullPeriod, '', '', '', '', 'Kab/Kota', regency?.name])
    worksheet.addRow(['Entitas / Puskesmas', entity?.name])
    worksheet.addRow([''])
    worksheet.addRow([''])

    const titleRow = [
      'No', 'Nama Entitas',
    ]
    intervalPeriod.forEach((period) => titleRow.push(period))

    worksheet.addRow([...titleRow, 'Total Frekuensi', 'Rata-rata Frekuensi'])

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
