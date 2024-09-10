import Excel from 'exceljs'
import moment from 'moment'

export const newOpnameWorkbook = async (datas) => {
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
    const worksheet = workbook.addWorksheet('Opname Stock', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Opname Stock', firstFooter: 'Opname Stock' },
    })
    const titleRow = ['Entitas', 'Provinsi Entitas', 'Kab/Kota Entitas',
      'Nama Material', 'Nomor Batch', 'Tanggal Kadaluwarsa',
      'Sisa Stok di SMILE', 'Distribusi Belum Diterima', 'Pengembalian Belum Diterima',
      'Sisa Stok Riil', 'Dilakukan Pada', 'Dilakukan Oleh']

    worksheet.addRow(titleRow)

    datas.forEach((data) => {
      const resultData = [
        data.new_opname_item?.new_opname?.entity?.name || '',
        data.new_opname_item?.new_opname?.entity?.province?.name || '',
        data.new_opname_item?.new_opname?.entity?.regency?.name || '',
        data.new_opname_item?.material?.name || '',
        data.batch_code,
        data.expired_date ? moment(data.expired_date).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss') : '',
        data.smile_qty,
        data.unsubmit_distribution_qty,
        data.unsubmit_return_qty,
        data.real_qty,
        moment(data.created_at).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss'),
        data.new_opname_item?.new_opname?.user_created_by?.firstname || '',
      ]

      worksheet.addRow(resultData)
    })
    return workbook
  } catch (err) {
    console.log(err)
  }
}
