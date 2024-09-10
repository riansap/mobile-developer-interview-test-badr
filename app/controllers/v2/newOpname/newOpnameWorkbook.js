import Excel from 'exceljs'
import moment from 'moment'

export const newOpnameWorkbook = async (datas, req) => {
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

    let headers = req.__(`report_header.stock_opname`)
    const titleRow = []
    for(let key in headers){
      titleRow.push(headers[key])
    }
    

    worksheet.addRow(titleRow)

    datas.forEach((data) => {
      const resultData = [
        data.new_opname_item?.new_opname?.entity?.name || '',
        data.new_opname_item?.new_opname?.entity?.province?.name || '',
        data.new_opname_item?.new_opname?.entity?.regency?.name || '',
        data.new_opname_item?.master_material?.name || '',
        data.batch_code,
        data.expired_date ? moment(data.expired_date).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss') : '',
        data.smile_qty,
        data.unsubmit_distribution_qty,
        data.unsubmit_return_qty,
        data.real_qty,
        moment(data.created_at).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss'),
        data.new_opname_item?.new_opname?.user_created_by?.firstname || '',
        data.new_opname_item?.new_opname?.activity?.name || '',
        data.new_opname_item?.new_opname?.period?.start_date || '',
        data.new_opname_item?.new_opname?.period?.end_date || '',
        Number(data.new_opname_item?.new_opname?.period?.status) === 1 ? req.__('custom.active') : req.__('custom.non_active'),
        data.new_opname_item?.new_opname?.period?.start_date ? moment(data.new_opname_item?.new_opname?.period?.start_date).tz('Asia/Jakarta').format('MMMM YYYY') : '',
        data.new_opname_item?.new_opname?.status ? req.__('custom.done_so') : req.__('custom.not_so')
      ]

      worksheet.addRow(resultData)
    })
    return workbook
  } catch (err) {
    console.log(err)
  }
}
