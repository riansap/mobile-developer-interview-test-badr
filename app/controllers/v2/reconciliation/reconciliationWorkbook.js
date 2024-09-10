import Excel from 'exceljs'
import { getRekonCategoryString } from '../../../helpers/constants'

export const reconciliationWorkbook = async (datas, res) => {
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
    const worksheet = workbook.addWorksheet('Reconciliation', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Reconciliation', firstFooter: 'Reconciliation' },
    })
    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }

      const titleCells = ['A1:B1', 'F1:I1', 'J1:M1', 'N1:Q1', 
        'R1:U1', 'V1:Y1', 'Z1:AC1', 'AD1:AG1',
        'C1:C2', 'D1:D2', 'E1:E2', 'AH1:AH2', 'AI1:AI2']

      titleCells.forEach((cell) => {
        worksheet.mergeCells(cell)
        worksheet.getCell(cell).alignment = alignmentCenter
      })
    }
    const titleRow1 = ['Periode', '', res.__('field.id.entity_id'), 'Material', res.__('report_header.reconciliation.activity')]
    const titleRow2 = [res.__('report_header.reconciliation.from'), res.__('report_header.reconciliation.to'), '', '', '']
    
    datas[0].reconciliation_items.forEach((item) => {
      let categoryLabel = res.__(`reconciliation.category.${getRekonCategoryString(item.stock_category)}`)
      titleRow1.push(categoryLabel, '', '', '')
      titleRow2.push('SMILE', 'Riil', res.__('report_header.reconciliation.reason'), res.__('report_header.reconciliation.action'))
    })
    worksheet.addRow([...titleRow1, res.__('report_header.stock_opname.done_at'), res.__('report_header.stock_opname.done_by')])
    worksheet.addRow([...titleRow2])

    datas.forEach((data, dataIdx) => {
      const resultData = [
        data.start_date,
        data.end_date,
        data.entity?.name || '',
        data.material?.name || '',
        data.activity?.name || '',
      ]

      let maxReason = 1
      data.reconciliation_items.forEach((reconciliationItem, reconItemIdx) => {
        resultData.push(
          reconciliationItem.smile_qty,
          reconciliationItem.real_qty,
          '',
          '',
        )
        let reasons = []
        let actions = []
        reconciliationItem.reason_actions.forEach(reason => {
          reasons.push(reason.reason)
          actions.push(reason.action)
        })
        datas[dataIdx].reconciliation_items[reconItemIdx].reasons = reasons
        datas[dataIdx].reconciliation_items[reconItemIdx].actions = actions
        if (reasons.length > maxReason) {
          maxReason = reasons.length
        }
      })
      // check reason multiple
      let startKey = 7
      for (let i = 0; i < maxReason; i++) {
        data.reconciliation_items.forEach((reconciliationItem) => {
          resultData[startKey] = reconciliationItem.reasons[i] ?  res.__(`reconciliation.reason.${reconciliationItem.reasons[i]?.id}`) : ''
          resultData[startKey + 1] =  reconciliationItem.actions[i] ? res.__(`reconciliation.action.${reconciliationItem.actions[i]?.id}`) : ''
          startKey += 4
        })
        worksheet.addRow(
          [
            ...resultData,
            data.created_at,
            data.user_created_by.firstname,
          ],
        )
        // reset key
        startKey = 7
      }
    })
    _adjustCell()
    return workbook
  } catch (err) {
    console.log(err)
  }
}