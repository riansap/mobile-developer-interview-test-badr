import Excel from 'exceljs'
import moment from 'moment-timezone'

export const exterminationWorkbook = async (data, provinceName, regencyName, req = {}) => {
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
    const title = req.__('recapitulation_by_dinkes')
    const worksheet = workbook.addWorksheet(title, {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: title, firstFooter: title },
    })

    for(let a = 1; a < 10; a++) {
      worksheet.getColumn(a).width = 30
    }

    worksheet.addRow([req.__('report_header.bapp.head1')])
    worksheet.addRow({})
    worksheet.addRow([req.__('report_header.bapp.head2')])
    worksheet.addRow([req.__('report_header.bapp.head3'), 'KPM-' + data.id])
    worksheet.addRow([req.__('report_header.bapp.head4'), data.vendor.name])
    worksheet.addRow([req.__('report_header.bapp.head5'), regencyName || ''])
    worksheet.addRow([req.__('report_header.bapp.head6'), provinceName || ''])
    worksheet.addRow([req.__('report_header.bapp.head7'), data.activity.name])
    worksheet.addRow({})
    worksheet.addRow({})
    let rowValues = []
    worksheet.addRow(req.__('report_header.bapp.head8'))
    let number = 1
    for(let i = 0; i < data.order_items.length; i++) {
      let item = data.order_items[i]
      for(let j = 0; j < item.order_stocks.length; j++) {
        let orderStock = item.order_stocks[j]
        for(let k = 0; k < orderStock.order_stock_exterminations.length; k++) {
          let orderStockExtermination = orderStock.order_stock_exterminations[k]
          rowValues = []
          rowValues[1] = number
          rowValues[2] = data?.vendor?.type_label
          rowValues[4] = item?.master_material?.code
          rowValues[5] = item?.master_material?.name
          rowValues[6] = orderStock?.stock?.batch?.code
          rowValues[7] = orderStockExtermination?.allocated_discard_qty + orderStockExtermination?.allocated_received_qty
          let reason = orderStockExtermination?.stock_extermination?.transaction_reason?.title
          rowValues[8] = req.__(`field.transaction_reason.list.${reason}`)
          worksheet.addRow(rowValues)
          number++
        }
      }
            
    }

    worksheet.addRow({})
    worksheet.addRow({})
    worksheet.addRow({})

    rowValues = []
    rowValues[1] = req.__('report_header.bapp.info1')
    rowValues[6] = req.__('report_header.bapp.info2')
    worksheet.addRow(rowValues)

    rowValues = []
    rowValues[1] = req.__('report_header.bapp.info3')
    rowValues[6] = req.__('report_header.bapp.info3')
    worksheet.addRow(rowValues)

    worksheet.addRow({})
    rowValues = []
    rowValues[1] = req.__('report_header.bapp.info4')
    rowValues[6] = req.__('report_header.bapp.info4')
    let signRow = worksheet.addRow(rowValues)

    rowValues[1] = '__________________'
    rowValues[6] = '__________________'
    worksheet.addRow(rowValues)
    worksheet.addRow({})

    rowValues = []
    let shippedBy = req.__('report_header.bapp.info5')
    let fulfilledBy = req.__('report_header.bapp.info5')
    if(data.user_shipped_by){
      shippedBy += data.user_shipped_by.firstname || '' + ' ' +data.user_shipped_by.lastname || ''
    }
    if(data.user_fulfilled_by){
      fulfilledBy += data.user_fulfilled_by.firstname || '' + ' ' +data.user_fulfilled_by.lastname || ''
    }
    rowValues[1] = shippedBy
    rowValues[2] = req.__('report_header.bapp.info6')
    rowValues[6] = fulfilledBy
    rowValues[7] = req.__('report_header.bapp.info6')
    worksheet.addRow(rowValues)

    rowValues = []
    rowValues[1] = req.__('report_header.bapp.info7')
    rowValues[6] = req.__('report_header.bapp.info7')
    worksheet.addRow(rowValues)

    worksheet.mergeCells('A1:F1')

    return workbook
  } catch(err) {
    throw Error(err)
  }
}