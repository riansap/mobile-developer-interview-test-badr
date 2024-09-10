import Excel from 'exceljs'
import moment from 'moment-timezone'
import { getLeadTime } from '../eventReportHelper'

export const eventReportWorkbook = async (datas) => {
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
    const title = 'Laporan Kejadian'
    const worksheet = workbook.addWorksheet(title, {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: title, firstFooter: title },
    })
    const titleRow = [
      'No laporan', 'Entitas Pelapor', 'Provinsi Entitas', 'Kab/Kota Entitas',
      'No Pesanan', 'No DO', 'Tanggal Kedatangan', 'Nama Material',
      'Nomor Batch', 'Tanggal Kadaluwarsa', 'Kuantitas', 'Alasan', 'Detail Alasan',
      'Lead Time', 'Pelapor ajukan pembatalan pesanan', 'Status', 'Komentar', 'Tanggal Dilaporkan',
    ]

    worksheet.addRow(titleRow)
    // console.log(titleRow1)
    datas.forEach((data) => {
      const resultData = [
        data.event_report_id,
        data.entity?.name || '',
        data.entity?.province?.name || '',
        data.entity?.regency?.name || '',
        data.order_id,
        data.no_packing_slip,
        data.arrived_date,
      ]

      data.items.forEach((item) => {
        worksheet.addRow(
          [
            ...resultData,
            item.material?.name || '',
            item.no_batch,
            item.expired_date,
            item.qty,
            item.reason?.title || '',
            item.child_reason?.title || '',
            getLeadTime(data),
            data.has_order ? 'Ya' : 'Tidak',
            data.status_label,
            data.comments[0]?.comment || '',
            moment(data.created_at).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss'),
          ],
        )
      })
    })
    return workbook
  } catch (err) {
    console.log(err)
    throw Error(err)
  }
}
