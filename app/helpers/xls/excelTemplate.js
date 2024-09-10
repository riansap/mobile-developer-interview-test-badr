/* eslint-disable no-underscore-dangle */
import Excel from 'exceljs'
import moment from 'moment'
import models from '../../models'
import { formatDateByTimezone, TRANSACTION_CHANGE_TYPE, STOCK_STATUS, ORDER_STATUS } from '../constants'
import { __ } from 'i18n'
import { noMinus } from '../common'

export const commonLists = (data, columns, model = 'List') => {
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

  const worksheet = workbook.addWorksheet(model, {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: { firstHeader: model, firstFooter: model },
  })

  const keyColumn = columns.map((item) => ({ key: item.key }))
  worksheet.columns = keyColumn

  const titleColumns = columns.map((item) => {
    if (item.title) return item.title
    return item.key
  })
  worksheet.addRow(titleColumns)

  for (let i = 0; i < data.length; i++) {
    worksheet.addRow(data[i])
  }

  return workbook
}

export const suratBuktiBarangKeluar = async (data) => {
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

    const worksheet = workbook.addWorksheet('Laporan', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Report Material', firstFooter: 'Report Material' },
    })

    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
      const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

      worksheet.mergeCells('A1:K1')
      worksheet.getCell('A1:K1').alignment = alignmentCenter

      const setColWidths = [
        { key: 'A', width: 12 },
        { key: 'B', width: 20 },
        { key: 'D', width: 12 },
        { key: 'G', width: 17 },
        { key: 'H', width: 13 },
        { key: 'I', width: 12 },
      ]
      setColWidths.forEach((col) => {
        const { key, width } = col
        worksheet.getColumn(key).width = width
      })

      // const orderItemsLength = data.order_items.length + 1
      let orderStockLength = 1
      data.order_items.forEach((item) => {
        orderStockLength += item.order_stocks.length
      })
      let start = 8
      for (let i = 0; i < orderStockLength; i++) {
        const dataCell = worksheet.getCell(`A${start}`)
        dataCell.alignment = alignmentCenter

        const arrColumnData = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
        for (let j = 0; j < arrColumnData.length; j++) {
          const cellStr = arrColumnData[j]
          const dataCell = worksheet.getCell(`${cellStr}${start}`)

          dataCell.alignment = alignmentLeft
          dataCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
        }

        start++
      }
    }

    const customer = data.customer.name

    const province = await models.Province.findByPk(data.customer.province_id)
    const provinceName = province ? province.name : ''

    const regency = await models.Regency.findByPk(data.customer.regency_id)
    const regencyName = regency ? regency.name : ''

    const sub_district = await models.SubDistrict.findByPk(data.customer.sub_district_id)
    const subDistrictName = sub_district ? sub_district.name : ''

    const activity = await models.MasterActivity.findByPk(data.activity_id)
    const activityName = activity ? activity.name : ''

    worksheet.columns = [
      { key: 'number' },
      { key: 'name' },
      { key: 'unit' },
      { key: 'price' },
      { key: 'volume' },
      { key: 'dosis' },
      { key: 'total_price' },
      { key: 'expired' },
      { key: 'batch' },
      { key: 'source' },
    ]

    worksheet.getColumn(1).values = ['Surat Bukti Barang Keluar (SBBK)', '', 'Penerima :', 'Kecamatan :', 'Kota :', 'Provinsi :', 'Kegiatan :', 'No :']
    worksheet.getColumn(2).values = ['', '', customer, subDistrictName, regencyName, provinceName, activityName, 'Nama Obat']
    worksheet.getColumn(3).values = ['', '', '', '', '', '', '', 'Satuan']
    worksheet.getColumn(4).values = ['', '', '', '', '', '', '', 'Harga']
    worksheet.getColumn(5).values = ['', '', '', '', '', '', '', 'Volume']
    worksheet.getColumn(6).values = ['', '', '', '', '', '', '', 'Jumlah']
    worksheet.getColumn(7).values = ['', '', '', '', '', '', '', 'Total Harga']
    worksheet.getColumn(8).values = ['', '', '', '', '', '', '', 'Expiry Date']
    worksheet.getColumn(9).values = ['', '', '', '', '', '', '', 'No. Batch']
    worksheet.getColumn(10).values = ['', '', '', '', '', '', '', 'Sumber']

    let itemLength = 0
    for (let index = 0; index < data.order_items.length; index++) {
      const items = data.order_items[index]

      items.order_stocks.forEach((orderStock) => {
        const { batch } = orderStock
        worksheet.addRow({
          number: itemLength + 1,
          name: items.material.name,
          unit: items.material.unit,
          dosis: orderStock.allocated_qty,
          expired: batch ? formatDateByTimezone(batch.expired_date) : '',
          batch: batch ? batch.code : '',
        })
        itemLength++
      })
    }

    const footerRow0 = ['', '', '', '', '', '', '', regencyName, data.shipped_at]
    const footerRow1 = ['', '', '', '', '', '', 'Yang Menyerahkan', '', 'Yang Menerima']
    const footerRow2 = ['', '', '', '', '', '', '________________', '', '_____________']

    worksheet.getRow(10 + itemLength).values = footerRow0
    worksheet.getRow(11 + itemLength).values = footerRow1
    worksheet.getRow(15 + itemLength).values = footerRow2

    _adjustCell()

    return workbook
  } catch (err) {
    console.log(err)
  }
}

export const suratBuktiBarangKeluarTwo = async (data, req = {}) => {
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

    const worksheet = workbook.addWorksheet(req.__('report'), {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Report Material', firstFooter: 'Report Material' },
    })

    const { order_items } = data


    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
      const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

      worksheet.mergeCells('A1:K1')
      worksheet.getCell('A1:K1').alignment = alignmentCenter

      const setColWidths = [
        { key: 'A', width: 12 },
        { key: 'B', width: 20 },
        { key: 'D', width: 12 },
        { key: 'G', width: 17 },
        { key: 'H', width: 13 },
        { key: 'I', width: 12 },
      ]
      setColWidths.forEach((col) => {
        const { key, width } = col
        worksheet.getColumn(key).width = width
      })

      // const orderItemsLength = data.order_items.length + 1

      let orderStockLength = 1
      order_items.forEach((item) => {
        orderStockLength += item.order_stocks.length
      })
      let start = 8
      for (let i = 0; i < orderStockLength; i++) {
        const dataCell = worksheet.getCell(`A${start}`)
        dataCell.alignment = alignmentCenter

        const arrColumnData = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
        for (let j = 0; j < arrColumnData.length; j++) {
          const cellStr = arrColumnData[j]
          const dataCell = worksheet.getCell(`${cellStr}${start}`)

          dataCell.alignment = alignmentLeft
          dataCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
        }

        start++
      }
    }

    const customer = data.customer.name

    const province = await models.Province.findByPk(data.customer.province_id)
    const provinceName = province ? province.name : ''

    const regency = await models.Regency.findByPk(data.customer.regency_id)
    const regencyName = regency ? regency.name : ''

    const sub_district = await models.SubDistrict.findByPk(data.customer.sub_district_id)
    const subDistrictName = sub_district ? sub_district.name : ''

    const activity = await models.MasterActivity.findByPk(data.activity_id)
    const activityName = activity ? activity.name : ''

    worksheet.columns = [
      { key: 'number' },
      { key: 'name' },
      { key: 'unit' },
      { key: 'distribution' },
      { key: 'price' },
      { key: 'total_price' },
      { key: 'consumption_unit' },
      { key: 'expired' },
      { key: 'batch' },
      { key: 'source' },
    ]

    worksheet.getColumn(1).values = [req.__('report_header.sbbk.head1'), '', req.__('report_header.sbbk.head2'), req.__('report_header.sbbk.head3'), req.__('report_header.sbbk.head4'), req.__('report_header.sbbk.head5'), req.__('report_header.sbbk.head6'), 'No :']
    worksheet.getColumn(2).values = ['', '', customer, subDistrictName, regencyName, provinceName, activityName, req.__('report_header.sbbk.head7')]

    if (process.env.APP_SERVICE === 'logistic') {
      worksheet.columns = [
        { key: 'number' },
        { key: 'name' },
        { key: 'unit' },
        { key: 'source' },
        { key: 'year' },
        { key: 'distribution' },
        { key: 'batch' },
        { key: 'expired' },
        { key: 'price' },
        { key: 'total_price' }
      ]

      worksheet.getColumn(3).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.unit')]
      worksheet.getColumn(4).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head14')]
      worksheet.getColumn(5).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.year')]
      worksheet.getColumn(6).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.amount')]
      worksheet.getColumn(7).values = ['', '', '', '', '', '', '', 'No. Batch']
      worksheet.getColumn(8).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head13')]
      worksheet.getColumn(9).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head10')]
      worksheet.getColumn(10).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head11')]
    } else {
      worksheet.getColumn(3).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head8')]
      worksheet.getColumn(4).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head9')]
      worksheet.getColumn(5).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head10')]
      worksheet.getColumn(6).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head11')]
      worksheet.getColumn(7).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head12')]
      worksheet.getColumn(8).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head13')]
      worksheet.getColumn(9).values = ['', '', '', '', '', '', '', 'No. Batch']
      worksheet.getColumn(10).values = ['', '', '', '', '', '', '', req.__('report_header.sbbk.head14')]
    }

    let itemLength = 0
    for (let index = 0; index < order_items.length; index++) {
      const items = order_items[index]

      items.order_stocks.forEach((orderStock) => {
        const { batch, order_stock_purchase, stock } = orderStock

        worksheet.addRow({
          number: itemLength + 1,
          name: items?.master_material?.name || items?.material?.master_material?.name,
          unit: items?.master_material?.unit || items?.material?.master_material?.unit,
          year: batch ? batch.year : '',
          distribution: orderStock.allocated_qty / items?.master_material?.pieces_per_unit,
          consumption_unit: orderStock.allocated_qty || 0,
          expired: batch ? formatDateByTimezone(batch.expired_date) : '',
          batch: batch ? batch.code : '',
          price: order_stock_purchase?.price || stock?.price,
          total_price: order_stock_purchase?.total_price || stock?.total_price,
          source: order_stock_purchase?.source_material?.name || stock?.source_material?.name,
        })
        itemLength++
      })
    }

    const footerRow0 = ['', '', '', '', '', '', '', regencyName, data.shipped_at]
    const footerRow1 = ['', '', '', '', '', '', req.__('report_header.sbbk.info1'), '', req.__('report_header.sbbk.info2')]
    const footerRow2 = ['', '', '', '', '', '', '________________', '', '_____________']

    worksheet.getRow(10 + itemLength).values = footerRow0
    worksheet.getRow(11 + itemLength).values = footerRow1
    worksheet.getRow(15 + itemLength).values = footerRow2

    _adjustCell()

    return workbook
  } catch (err) {
    console.log(err)
  }
}

export const transactionLogBook = (data) => {
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

  if (data.length < 1) {
    workbook.addWorksheet('', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Report Transaction', firstFooter: 'Report Transaction' },
    })
  }
  data.forEach((data) => {
    const worksheet = workbook.addWorksheet(data.material_name, {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Report Transaction', firstFooter: 'Report Transaction' },
    })

    const { transactions } = data

    worksheet.columns = [
      { key: 'receive_institution_name' },
      { key: 'receive_date' },
      { key: 'receive_total' },
      { key: 'receive_dosis' },
      { key: 'receive_vvm' },
      { key: 'receive_no_batch' },
      { key: 'receive_ed' },
      { key: 'issue_institution_name' },
      { key: 'issue_date' },
      { key: 'issue_total' },
      { key: 'issue_dosis' },
      { key: 'issue_vvm' },
      { key: 'issue_no_batch' },
      { key: 'issue_ed' },
      { key: 'akumulatif' },
      { key: 'keterangan' },
      { key: 'reasons' },
    ]

    worksheet.getColumn(1).values = ['PENCATATAN STOK VAKSIN/LOGISTIK', '', 'PROGRAM IMUNISASI', 'Penerimaan', 'Nama Institusi']
    worksheet.getColumn(2).values = ['', '', '', '', 'Tanggal']
    worksheet.getColumn(3).values = ['', '', '', '', 'Jumlah']
    worksheet.getColumn(4).values = ['', '', '', '', 'Dosis/Buah/Pasang']
    worksheet.getColumn(5).values = ['', 'NAMA VAKSIN/LOGISTIK:', '', '', 'VVM']
    worksheet.getColumn(6).values = ['', '', '', '', 'No. Batch']
    worksheet.getColumn(7).values = ['', '', '', '', 'ED']
    worksheet.getColumn(8).values = ['', data.material_name, '', 'Pengeluaran', 'Nama Institusi']
    worksheet.getColumn(9).values = ['', data.is_vaccine, '', '', 'Tanggal']
    worksheet.getColumn(10).values = ['', '', '', '', 'Jumlah']
    worksheet.getColumn(11).values = ['', '', '', '', 'Dosis/Buah/Pasang']
    worksheet.getColumn(12).values = ['', '', '', '', 'VVM']
    worksheet.getColumn(13).values = ['', '', '', '', 'No. Batch']
    worksheet.getColumn(14).values = ['', '', '', '', 'ED']
    worksheet.getColumn(15).values = ['', '', '', '', 'Sisa Akumulatif']
    worksheet.getColumn(16).values = ['', '', '', '', 'Keterangan']
    worksheet.getColumn(17).values = ['', '', '', '', 'Alasan']

    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }

      const titleCells = ['A1:P1', 'A3:P3', 'A4:G4', 'H4:N4', 'E2:G2']

      titleCells.forEach((cell) => {
        worksheet.mergeCells(cell)
        worksheet.getCell(cell).alignment = alignmentCenter
      })
    }

    const { stock_batches } = data

    let akumulatif = 0
    let keterangan = ''
    if (stock_batches.length > 0) {
      for (const batch of stock_batches) {
        akumulatif += batch.quantity
        worksheet.addRow({
          receive_institution_name: `Sisa Stock ${moment().month(data.month).year(data.year).add(-1, 'months')
            .format('MMMM yyyy')}`,
          receive_date: '',
          receive_total: '',
          receive_dosis: batch.quantity,
          receive_vvm: '',
          receive_no_batch: batch.no_batch,
          receive_ed: batch.ed,
          akumulatif,
          reasons: '',
        })
      }
    }

    transactions.forEach((transaction) => {
      let addRow = {}
      const lastAkumulatif = akumulatif

      if (transaction.chg_type === TRANSACTION_CHANGE_TYPE.ADD) {
        // transaction.type_id === TRANSACTION_TYPE.RECEIPTS
        akumulatif += transaction.dosis
      } else {
        // TRANSACTION_CHANGE_TYPE.REMOVE
        akumulatif -= transaction.dosis
      }

      if (transaction.chg_type === TRANSACTION_CHANGE_TYPE.ADD) {
        // transaction.type_id === TRANSACTION_TYPE.RECEIPTS
        addRow = {
          receive_institution_name: transaction.institution_name,
          receive_date: transaction.date,
          receive_total: transaction.total,
          receive_dosis: transaction.dosis,
          receive_vvm: transaction.vvm,
          receive_no_batch: transaction.no_batch,
          receive_ed: transaction.ed,
          akumulatif,
          keterangan: transaction.other_reasons,
          reasons: transaction.reasons,
        }
      } else {
        if (transaction.chg_type === TRANSACTION_CHANGE_TYPE.RESTOCK) {
          // transaction.type_id === TRANSACTION_TYPE.STOCK_COUNT
          keterangan = transaction.dosis - lastAkumulatif
          akumulatif = (lastAkumulatif - transaction.opening_qty) + transaction.dosis
        }

        addRow = {
          issue_institution_name: transaction.institution_name,
          issue_date: transaction.date,
          issue_total: transaction.total,
          issue_dosis: transaction.dosis,
          issue_vvm: transaction.vvm,
          issue_no_batch: transaction.no_batch,
          issue_ed: transaction.ed,
          akumulatif,
          reasons: transaction.reasons,
        }
      }

      worksheet.addRow({
        ...addRow,
      })
    })

    _adjustCell()
  })

  return workbook
}

export const varReport = async (data) => {
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

    const worksheet = workbook.addWorksheet('Laporan', {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'VAR Report', firstFooter: 'VAR Report' },
    })
    worksheet.properties.defaultColWidth = 11

    let startTable = 10
    const alignmentWrap = { wrapText: true, shrinkToFit: true }
    const fontBold = { bold: true }

    const shippedAt = data.shipped_at ? moment(data.shipped_at).format('DD/MM/YYYY HH:mm:ss') : ''

    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
      const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

      const mergeCells = [
        'A9:A11',
        'A5:C5',
        'A6:C6',
        'A7:C7',
        'E6:F6',
        'E7:F7',
        'B9:B11',
        'C9:C11',
        'D9:D11',
        'E9:E11',
        'F9:F11',
        'G9:G11',
        'H9:M9',
        'I10:L10',
        'H10:H11',
        'M10:M11',
        'N9:S9',
        'O10:R10',
        'N10:N11',
        'S10:S11',
      ]
      mergeCells.forEach((cells) => {
        worksheet.mergeCells(cells)
      })

      const setColWidths = [
        { key: 'B', width: 25 },
        { key: 'D', width: 25 },
        { key: 'F', width: 15 },
        { key: 'G', width: 18 },
        { key: 'H', width: 28 },
        { key: 'N', width: 17 },
        { key: 'I', width: 5 },
        { key: 'J', width: 5 },
        { key: 'K', width: 5 },
        { key: 'L', width: 5 },
        { key: 'O', width: 5 },
        { key: 'P', width: 5 },
        { key: 'Q', width: 5 },
        { key: 'R', width: 5 },
      ]
      setColWidths.forEach((col) => {
        const { key, width } = col
        worksheet.getColumn(key).width = width
      })

      let orderStockLength = 3
      data.order_items.forEach((item) => {
        orderStockLength += item.order_stocks.length
      })
      for (let i = 0; i < orderStockLength; i++) {
        const dataCell = worksheet.getCell(`A${startTable}`)
        dataCell.alignment = alignmentCenter

        const arrColumnData = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S']
        for (let j = 0; j < arrColumnData.length; j++) {
          const cellStr = arrColumnData[j]
          const dataCell = worksheet.getCell(`${cellStr}${startTable}`)

          dataCell.alignment = alignmentLeft
          dataCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
        }
        startTable++
      }
    }

    const customer = data.customer.name
    const vendor = data.vendor.name
    const activity = await models.MasterActivity.findByPk(data.activity_id)
    const activityName = activity ? activity.name : ''

    worksheet.columns = [
      { key: 'number' },
      { key: 'name' },
      { key: 'unit' },
      { key: 'price' },
      { key: 'volume' },
      { key: 'dosis' },
      { key: 'total_price' },
      { key: 'expired' },
      { key: 'batch' },
      { key: 'source' },
    ]

    const defaultRows = [
      ['LAPORAN PENERIMAAN VAKSIN'],
      ['(VACCINE ARRIVAL REPORT/VAR)'],
      [''],
      [''],
      ['Tujuan (Penerima):', '', '', '', customer],
      ['Nomor/Tanggal Surat Bukti Barang Keluar(SBBK):', '', '', '', '/Tanggal Pengiriman:', '', `${shippedAt}`, '', '', '', '', '', '', 'Sarana Angkutan:', 'Kend.Umum/Dinas/Pribadi/Truk/Pesawat'],
      ['Tgl. Pemberitahuan Kedatangan Barang:', '', '', '', '(Telp/Surat/Fax):', '', '', 'Rencana Kedatangan Barang Tgl: '],
      ['Kegiatan:', '', `${activityName}`, '', '', '', '', '', ''],
      [''],
      ['No', 'Nama Barang', 'Kemasan', 'Jumlah (Vial/Amp/Buah)', 'Jumlah (Unit/Dosis)', 'No. Batch', 'Exp. Date', `SAAT DIKIRIM DARI ${vendor}`, '', '', '', '', '', `SAAT DITERIMA DI ${customer}`],
      ['', '', '', '', '', '', '', 'Kondisi Freeze Tag* (Ya/Tidak)', 'KONDISI VVM**', '', '', '', 'Suhu C', 'Kondisi Freeze Tag* (Ya/Tidak)', 'KONDISI VVM**', '', '', '', 'Suhu C'],
      ['', '', '', '', '', '', '', '', 'A', 'B', 'C', 'D', '', '', 'A', 'B', 'C', 'D', ''],
    ]
    for (let rows = 1; rows <= defaultRows.length; rows++) {
      const selectedRow = worksheet.getRow(rows)
      selectedRow.values = defaultRows[rows - 1]
      if (rows >= startTable) {
        selectedRow.height = 25
        selectedRow.alignment = alignmentWrap
      }
    }

    let totalBatches = 0
    for (let index = 0; index < data.order_items.length; index++) {
      const items = data.order_items[index]
      items.order_stocks.forEach((orderStock) => {
        const { batch } = orderStock
        totalBatches++
        worksheet.addRow([
          index + 1,
          items.material.name,
          '',
          '',
          orderStock.allocated_qty,
          batch ? batch.code : '',
          batch ? formatDateByTimezone(batch.expired_date) : '',
          '',
          orderStock.status === STOCK_STATUS.VVMA ? 'A' : '',
          orderStock.status === STOCK_STATUS.VVMB ? 'B' : '',
          orderStock.status === STOCK_STATUS.VVMC ? 'C' : '',
          orderStock.status === STOCK_STATUS.VVMD ? 'D' : '',
        ])
      })
    }

    const infoRows = [
      [''],
      ['', 'URAIAN KEDATANGAN'],
      ['', 'Nomor Penerbangan:', '', '', '', '', '', 'Nomor Kendaraan/ No. Pol:', ''],
      ['', 'Tanggal Kedatangan:', '', '', '', '', '', 'Nama Perusahaan Pengantar:', ''],
      ['', 'Nama Petugas Pengantar Barang:'],
      ['', 'Komentar:'],
      [''],
      ['', '', '', 'Mengetahui,', '', '', '', '', '', '', '', '', '', 'Yang Menerima,'],
      ['', '', '', vendor, '', '', '', '', '', '', '', '', '', customer],
    ]
    infoRows.forEach((infoRow) => {
      worksheet.addRow(infoRow)
    })
    worksheet.getCell('A1').font = fontBold
    const footerRow = 13 + totalBatches
    worksheet.getCell(`B${footerRow}`).font = fontBold

    _adjustCell()

    return workbook
  } catch (err) {
    console.log(err)
  }
}

export const varReportTwo = async (data, req = {}) => {
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

    const worksheet = workbook.addWorksheet(req.__('report'), {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'VAR Report', firstFooter: 'VAR Report' },
    })
    worksheet.properties.defaultColWidth = 11

    let startTable = 10
    const alignmentWrap = { wrapText: true, shrinkToFit: true }
    const fontBold = { bold: true }

    const shippedAt = data?.shipped_at ? moment(data?.shipped_at).format('DD/MM/YYYY HH:mm:ss') : ''

    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
      const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

      const mergeCells = [
        'A10:A12',
        'A5:C5',
        'A6:C6',
        'A7:C7',
        'E6:F6',
        'E7:F7',
        'B10:B12',
        'C10:C12',
        'D10:D12',
        'E10:E12',
        'F10:F12',
        'G10:G12',
        'H10:M10',
        'I11:L11',
        'H11:H12',
        'M11:M12',
        'N10:S10',
        'O11:R11',
        'N11:N12',
        'S11:S12',
      ]
      mergeCells.forEach((cells) => {
        worksheet.mergeCells(cells)
      })

      const setColWidths = [
        { key: 'B', width: 25 },
        { key: 'D', width: 25 },
        { key: 'F', width: 15 },
        { key: 'G', width: 18 },
        { key: 'H', width: 28 },
        { key: 'N', width: 17 },
        { key: 'I', width: 5 },
        { key: 'J', width: 5 },
        { key: 'K', width: 5 },
        { key: 'L', width: 5 },
        { key: 'O', width: 5 },
        { key: 'P', width: 5 },
        { key: 'Q', width: 5 },
        { key: 'R', width: 5 },
      ]
      setColWidths.forEach((col) => {
        const { key, width } = col
        worksheet.getColumn(key).width = width
      })

      let orderStockLength = 3
      data.order_items.forEach((item) => {
        orderStockLength += item.order_stocks.length
      })
      for (let i = 0; i < orderStockLength; i++) {
        const dataCell = worksheet.getCell(`A${startTable}`)
        dataCell.alignment = alignmentCenter

        const arrColumnData = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S']
        for (let j = 0; j < arrColumnData.length; j++) {
          const cellStr = arrColumnData[j]
          const dataCell = worksheet.getCell(`${cellStr}${startTable}`)

          dataCell.alignment = alignmentLeft
          dataCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
        }
        startTable++
      }
    }

    const customer = data.customer.name
    const vendor = data.vendor.name
    const activity = await models.MasterActivity.findByPk(data.activity_id)
    const activityName = activity ? activity.name : ''

    worksheet.columns = [
      { key: 'number' },
      { key: 'name' },
      { key: 'unit' },
      { key: 'price' },
      { key: 'volume' },
      { key: 'dosis' },
      { key: 'total_price' },
      { key: 'expired' },
      { key: 'batch' },
      { key: 'source' },
    ]

    const defaultRows = [
      [req.__('report_header.var.head1')],
      ['(VACCINE ARRIVAL REPORT/VAR)'],
      [''],
      [''],
      [req.__('report_header.var.head2'), '', '', '', customer],
      [req.__('report_header.var.head3'), '', '', '', req.__('report_header.var.head4'), '', `${shippedAt}`, '', '', '', '', '', '', req.__('report_header.var.head5'), req.__('report_header.var.head20')],
      [req.__('report_header.var.head6'), '', '', '', req.__('report_header.var.head7'), '', '', req.__('report_header.var.head8')],
      [req.__('activity'), '', `${activityName}`, '', '', '', '', '', ''],
      [''],
      ['No', req.__('report_header.var.head9'), req.__('report_header.var.head10'), req.__('report_header.var.head11'), req.__('report_header.var.head12'), req.__('report_header.var.head13'), req.__('report_header.var.head14'), `${req.__('report_header.var.head15')} ${vendor}`, '', '', '', '', '', `${req.__('report_header.var.head16')} ${customer}`],
      ['', '', '', '', '', '', '', req.__('report_header.var.head17'), req.__('report_header.var.head18'), '', '', '', req.__('report_header.var.head19'), req.__('report_header.var.head17'), req.__('report_header.var.head18'), '', '', '', req.__('report_header.var.head19')],
      ['', '', '', '', '', '', '', '', 'A', 'B', 'C', 'D', '', '', 'A', 'B', 'C', 'D', ''],
    ]
    for (let rows = 1; rows <= defaultRows.length; rows++) {
      const selectedRow = worksheet.getRow(rows)
      selectedRow.values = defaultRows[rows - 1]
      if (rows >= startTable) {
        selectedRow.height = 25
        selectedRow.alignment = alignmentWrap
      }
    }

    let totalBatches = 0
    for (let index = 0; index < data.order_items.length; index++) {
      const items = data.order_items[index]
      items.order_stocks.forEach((orderStock) => {
        const { batch } = orderStock
        totalBatches++
        worksheet.addRow([
          index + 1,
          items?.master_material?.name || items?.material?.master_material?.name,
          '',
          '',
          orderStock.allocated_qty,
          batch ? batch.code : '',
          batch ? formatDateByTimezone(batch.expired_date) : '',
          '',
          orderStock.status === STOCK_STATUS.VVMA ? 'A' : '',
          orderStock.status === STOCK_STATUS.VVMB ? 'B' : '',
          orderStock.status === STOCK_STATUS.VVMC ? 'C' : '',
          orderStock.status === STOCK_STATUS.VVMD ? 'D' : '',
        ])
      })
    }

    const infoRows = [
      [''],
      ['', req.__('report_header.var.info1')],
      ['', req.__('report_header.var.info2'), '', '', '', '', '', req.__('report_header.var.info6'), ''],
      ['', req.__('report_header.var.info3'), '', '', '', '', '', req.__('report_header.var.info7'), ''],
      ['', req.__('report_header.var.info4')],
      ['', req.__('report_header.var.info5')],
      [''],
      ['', '', '', req.__('report_header.var.info8'), '', '', '', '', '', '', '', '', '', req.__('report_header.var.info9')],
      ['', '', '', vendor, '', '', '', '', '', '', '', '', '', customer],
    ]
    infoRows.forEach((infoRow) => {
      worksheet.addRow(infoRow)
    })
    worksheet.getCell('A1').font = fontBold
    const footerRow = 13 + totalBatches
    worksheet.getCell(`B${footerRow}`).font = fontBold

    _adjustCell()

    return workbook
  } catch (err) {
    console.log(err)
  }
}


export const varReportLogistic = async (data, req = {}) => {
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

    const worksheet = workbook.addWorksheet(req.__('report'), {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'VAR Report', firstFooter: 'VAR Report' },
    })
    worksheet.properties.defaultColWidth = 15

    const fontBold = { bold: true }

    const shippedAt = data?.shipped_at ? moment(data?.shipped_at).format('DD/MM/YYYY') : ''

    const customer = data.customer.name
    const activity = await models.MasterActivity.findByPk(data?.activity_id)
    const activityName = activity ? activity.name : ''

    const province = await models.Province.findByPk(data?.customer.province_id)
    const provinceName = province ? province.name : ''

    const regency = await models.Regency.findByPk(data?.customer.regency_id)
    const regencyName = regency ? regency.name : ''

    const sub_district = await models.SubDistrict.findByPk(data?.customer.sub_district_id)
    const subDistrictName = sub_district ? sub_district.name : ''

    worksheet.getRow(1).values = ['Surat Bukti Penerimaan']
    worksheet.getCell('A1').font = fontBold
    worksheet.getCell('A1').alignment = { horizontal: 'center' }

    worksheet.mergeCells('A1:K1')

    worksheet.getRow(3).values = ['Penerima : ', customer]
    worksheet.getRow(4).values = ['Kecamatan : ', subDistrictName]
    worksheet.getRow(5).values = ['Kota : ', regencyName]
    worksheet.getRow(6).values = ['Provinsi : ', provinceName]
    worksheet.getRow(7).values = ['Kegiatan :  ', activityName]

    worksheet.getRow(8).values = ['No.', 'Nama Obat', 'Satuan', 'Sumber Anggaran', 'Tahun Anggaran', 'Jumlah Vial', 'Jumlah Dosis', 'No. Batch', 'Tgl Kadaluwarsa', 'Harga Satuan', 'Jumlah Harga']

    let startRow = 9

    for (let item of data.order_items) {
      item.order_stocks.forEach((orderStock) => {
        const { batch } = orderStock
        const {master_material} = item
        const {pieces_per_unit} = master_material
        worksheet.getRow(startRow).values = [
          startRow - 8,
          master_material?.name || item?.material?.name,
          master_material?.unit || '',
          batch ? batch.source_material_name : '',
          batch ? batch.year : '',
          pieces_per_unit ? Number((orderStock.allocated_qty/pieces_per_unit).toFixed(2)) : '',
          orderStock.allocated_qty,
          batch ? batch.code : '',
          batch ? formatDateByTimezone(batch.expired_date) : '',
          batch ? batch.price : '',
          batch ? batch.total_price : ''
        ]
        startRow++
      })
    }

    const colArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

    /* set border on table */
    for (let i = 8; i < startRow; i++) {
      for (let colAr of colArr) {
        const dataCell = worksheet.getCell(`${colAr}${i}`)
        dataCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      }
    }

    startRow++

    worksheet.getCell(`J${startRow}`).value = regencyName
    worksheet.getCell(`K${startRow}`).value = shippedAt

    startRow++
    worksheet.getCell(`I${startRow}`).value = 'Yang Menyerahkan'
    worksheet.getCell(`K${startRow}`).value = 'Yang Menerima'

    worksheet.getCell(`I${startRow + 4}`).value = '________________'
    worksheet.getCell(`K${startRow + 4}`).value = '________________'

    return workbook
  } catch (err) {
    console.log(err)
  }
}

export const requirementLetter = async (data, req) => {
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

  const worksheet = workbook.addWorksheet(req.__('report_header.requirement_letter.title'), {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: {
      firstHeader: req.__('report_header.requirement_letter.title'),
      firstFooter: req.__('report_header.requirement_letter.title')
    },
  })
  worksheet.properties.defaultColWidth = 11

  const [vRegency, vProvince] = await Promise.all([
    models.Regency.findOne({
      where: {
        id: data?.vendor?.regency_id
      },
      raw: true
    }),
    models.Province.findOne({
      where: {
        id: data?.vendor?.province_id
      },
      raw: true
    })
  ])
  const logistic_letter = process.env.APP_SERVICE === 'logistic' ? '_logistic' : ''
  const title_letter = req.__('report_header.requirement_letter.title_letter' + logistic_letter)
  const inorder_letter = req.__('report_header.requirement_letter.inorder' + logistic_letter, { activity: data?.activity?.name })

  worksheet.addRows([
    [`${title_letter} ${data?.customer?.name ?? ''}`],
    '',
    ['No surat'],
    [`${req.__('report_header.requirement_letter.provider')}: `, data?.vendor?.name ?? ''],
    [`${req.__('report_header.requirement_letter.city')}: `, vRegency?.name ?? ''],
    [`${req.__('report_header.requirement_letter.province')}: `, vProvince?.name ?? ''],
    [`${req.__('report_header.requirement_letter.activity')}: `, data?.activity?.name],
    '',
    [`${inorder_letter}: `],
    ''
  ]) // headers

  const colOrderItem = [
    'No.',
    req.__('report_header.requirement_letter.material_name'),
    req.__('report_header.requirement_letter.unit'),
    req.__('report_header.requirement_letter.price'),
    req.__('report_header.requirement_letter.volume'),
    req.__('report_header.requirement_letter.remaining'),
    req.__('report_header.requirement_letter.min'),
    req.__('report_header.requirement_letter.max'),
    req.__('report_header.requirement_letter.recommendation'),
    req.__('report_header.requirement_letter.request'),
  ]

  if (process.env.APP_SERVICE === 'logistic') {
    colOrderItem.splice(3, 2)
    colOrderItem.splice(4, 0, req.__('report_header.requirement_letter.average_usage'))
  }

  worksheet.addRow(colOrderItem) // header rows

  const { order_items = [] } = data
  let number = 0
  if (order_items.length > 0) {
    order_items.forEach((item) => {
      let min = 0, max = 0
      if (process.env.APP_SERVICE === 'logistic') {
        const { stock_customer, children } = item
        if (children.length <= 0) {
          number += 1
          worksheet.addRow([
            number,
            item?.name_kfa_product_template || '',
            '',
            stock_customer?.on_hand_stock || '',
            '',
            stock_customer?.min || '',
            stock_customer?.max || '',
            item?.recommended_stock || '',
            item?.qty,
          ])
        } else {
          min = 0
          max = 0
          children.forEach(childItem => {
            const { entity_master_material_activities = [] } = childItem?.stock_customer
            if (entity_master_material_activities.length > 0) {
              min = entity_master_material_activities[0].min
              max = entity_master_material_activities[0].max
            }
            number += 1
            worksheet.addRow([
              number,
              childItem?.material?.name || '',
              childItem?.material?.unit || '',
              childItem?.stock_customer?.on_hand_stock || '',
              '',
              min || '',
              max || '',
              childItem?.recommended_stock || '',
              childItem?.qty
            ])
          })
        }
      } else {
        const { entity_master_material_activities = [] } = item?.stock_customer
        if (entity_master_material_activities.length > 0) {
          min = entity_master_material_activities[0].min
          max = entity_master_material_activities[0].max
        }
        number += 1
        worksheet.addRow([
          number,
          item?.material?.name || '',
          item?.material?.unit || '',
          '',
          '',
          item?.stock_customer?.on_hand_stock || '',
          min || '',
          max || '',
          item?.recommended_stock || '',
          item?.qty,
        ])
      }
    })
  }

  worksheet.addRows([
    '', '', '',
    ['', `${req.__('report_header.requirement_letter.created_by')},`, '', '', '', `${req.__('report_header.requirement_letter.know')},`],
    '', '', '',
    ['', '_____________', '', '', '', '_____________'],
    '',
    [`${req.__('report_header.requirement_letter.date')}:`, moment(data?.created_at).format('YYYY-MM-DD HH:mm:ss'), '', '', '', `${data?.user_created_by?.firstname} ${(data?.user_created_by?.lastname || '')}`, `${req.__('report_header.requirement_letter.date')}:`,]
  ])

  // adjust
  worksheet.mergeCells(1, 6, 1, 1)

  const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
  const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

  worksheet.getColumn('A').alignment = alignmentLeft
  worksheet.getColumn('F').alignment = alignmentLeft
  worksheet.getColumn('G').alignment = alignmentLeft

  worksheet.getCell(1, 1).alignment = alignmentCenter

  const rowCount = new Array(number + 1).fill(true)
  const colCount = new Array(colOrderItem.length).fill(true)

  let startRow = 11
  rowCount.forEach(_ => {
    colCount.forEach((_, i) => {
      worksheet.getCell(startRow, i + 1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    startRow += 1
  })

  worksheet.getColumn('B').width = 17
  worksheet.getColumn('F').width = 32
  worksheet.getColumn('G').width = 17

  return workbook
}

export const notaConfirmation = async (data, req) => {
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

  const worksheet = workbook.addWorksheet(req.__('report_header.nota_confirmation.title'), {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: {
      firstHeader: req.__('report_header.nota_confirmation.title'),
      firstFooter: req.__('report_header.nota_confirmation.title')
    },
  })
  worksheet.properties.defaultColWidth = 11

  const [vRegency, vProvince] = await Promise.all([
    models.Regency.findOne({
      where: {
        id: data?.vendor?.regency_id
      },
      raw: true
    }),
    models.Province.findOne({
      where: {
        id: data?.vendor?.province_id
      },
      raw: true
    })
  ])

  const title_letter = process.env.APP_SERVICE === 'logistic' ? req.__('report_header.nota_confirmation.title_letter_logistic') : req.__('report_header.nota_confirmation.title_letter')

  worksheet.addRows([
    [`${title_letter} ${data?.vendor?.name ?? ''}`],
    '',
    ['No surat: ', data?.id.toString()],
    [`${req.__('report_header.nota_confirmation.provider')}: `, data?.vendor?.name ?? ''],
    [`${req.__('report_header.nota_confirmation.city')}: `, vRegency?.name ?? ''],
    [`${req.__('report_header.nota_confirmation.province')}: `, vProvince?.name ?? ''],
    [`${req.__('report_header.nota_confirmation.activity')}: `, data?.activity?.name],
    '', ''
  ]) // headers

  if (process.env.APP_SERVICE === 'logistic') {
    worksheet.addRow([
      'No:',
      req.__('report_header.nota_confirmation.material_name'),
      req.__('report_header.nota_confirmation.unit'),
      req.__('report_header.nota_confirmation.remaining'),
      req.__('report_header.nota_confirmation.average_usage'),
      req.__('report_header.nota_confirmation.recommendation'),
      req.__('report_header.nota_confirmation.request'),
      req.__('report_header.nota_confirmation.confirmation'),
    ]) // header rows
  } else {
    worksheet.addRow([
      'No:',
      req.__('report_header.nota_confirmation.material_name'),
      req.__('report_header.nota_confirmation.unit'),
      req.__('report_header.nota_confirmation.price'),
      req.__('report_header.nota_confirmation.volume'),
      req.__('report_header.nota_confirmation.remaining'),
      req.__('report_header.nota_confirmation.request'),
      req.__('report_header.nota_confirmation.confirmation'),
    ]) // header rows
  }


  const { order_items = [] } = data
  let number = 0
  if (order_items.length > 0) {
    order_items.forEach((item) => {
      if (process.env.APP_SERVICE == 'logistic') {
        const { children = [] } = item
        if (children.length <= 0) {
          number += 1
          worksheet.addRow([
            number,
            item?.name_kfa_product_template || '',
            '',
            item?.stock_customer?.on_hand_stock || '',
            '',
            '',
            item?.qty ?? 0,
            item?.confirmed_qty ?? 0
          ])
        } else {
          children.forEach(childItem => {
            number += 1
            worksheet.addRow([
              number,
              childItem?.material?.name || '',
              childItem?.material?.unit || '',
              childItem?.stock_customer?.on_hand_stock || '',
              '',
              '',
              childItem?.qty ?? 0,
              childItem?.confirmed_qty ?? 0
            ])
          })
        }
      } else {
        number += 1
        worksheet.addRow([
          number,
          item?.material?.name || '',
          item?.material?.unit || '',
          '',
          '',
          item?.stock_customer?.on_hand_stock || '',
          item?.qty ?? 0,
          item?.confirmed_qty ?? 0
        ])
      }
    })
  }

  worksheet.addRows([
    '', '', '',
    ['', `${req.__('report_header.nota_confirmation.created_by')},`, '', '', '', `${req.__('report_header.nota_confirmation.know')},`],
    '', '', '',
    ['', '_____________', '', '', '', '_____________'],
    '',
    [`${req.__('report_header.nota_confirmation.date')}:`, moment(data?.created_at).format('YYYY-MM-DD HH:mm:ss'), '', '', '', `${data?.user_created_by?.firstname} ${data?.user_created_by?.lastname || ''}`, `${req.__('report_header.nota_confirmation.date')}:`,]
  ])

  // adjust
  worksheet.mergeCells(1, 6, 1, 1)
  const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
  const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

  worksheet.getColumn('A').alignment = alignmentLeft
  worksheet.getColumn('F').alignment = alignmentLeft
  worksheet.getColumn('G').alignment = alignmentLeft
  worksheet.getColumn('H').alignment = alignmentLeft

  worksheet.getCell(1, 1).alignment = alignmentCenter

  const rowCount = new Array(number + 1).fill(true)
  const colCount = new Array(8).fill(true)

  let startRow = 10
  rowCount.forEach(_ => {
    colCount.forEach((_, i) => {
      worksheet.getCell(startRow, i + 1).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    startRow += 1
  })

  worksheet.getColumn('B').width = 17
  worksheet.getColumn('F').width = 32
  worksheet.getColumn('G').width = 17
  worksheet.getColumn('H').width = 21

  return workbook
}

export const notaBatch = async (data, req) => {
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

  const worksheet = workbook.addWorksheet(req.__('report_header.nota_batch.title'), {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: {
      firstHeader: req.__('report_header.nota_batch.title'),
      firstFooter: req.__('report_header.nota_batch.title')
    },
  })
  worksheet.properties.defaultColWidth = 11

  const [vRegency, vProvince] = await Promise.all([
    models.Regency.findOne({
      where: {
        id: data?.vendor?.regency_id
      },
      raw: true
    }),
    models.Province.findOne({
      where: {
        id: data?.vendor?.province_id
      },
      raw: true
    })
  ])

  const title_letter = process.env.APP_SERVICE === 'logistic' ? req.__('report_header.nota_batch.title_letter_logistic') : req.__('report_header.nota_batch.title_letter')

  worksheet.addRows([
    [`${title_letter} ${data?.vendor?.name ?? ''}`],
    '',
    ['No surat: ', data?.id + ''],
    [`${req.__('report_header.nota_batch.provider')}: `, data?.vendor?.name ?? ''],
    [`${req.__('report_header.nota_batch.city')}: `, vRegency?.name ?? ''],
    [`${req.__('report_header.nota_batch.province')}: `, vProvince?.name ?? ''],
    [`${req.__('report_header.nota_batch.activity')}: `, data?.activity?.name],
    '', ''
  ]) // headers


  const colHeader = [
    'No.',
    req.__('report_header.nota_batch.material_name'),
    req.__('report_header.nota_batch.unit'),
    req.__('report_header.nota_batch.price'),
    req.__('report_header.nota_batch.volume'),
    req.__('report_header.nota_batch.remaining'),
    req.__('report_header.nota_batch.request'),
    req.__('report_header.nota_batch.confirmation'),
    req.__('report_header.nota_batch.allocated'),
    req.__('report_header.nota_batch.batch_confirmation'),
    req.__('report_header.nota_batch.expired_date')
  ]

  if (process.env.APP_SERVICE === 'logistic') {
    colHeader.splice(3, 2)
  }

  worksheet.addRow(colHeader) // header rows

  let order_items = []
  if (process.env.APP_SERVICE === 'logistic') {
    let data_order_items = data?.order_items || []
    for (let dataItem of data_order_items) {
      const { children = [] } = dataItem
      children.forEach(childItem => order_items.push(childItem))
    }
  } else {
    order_items = data?.order_items || []
  }


  let dataRows = []
  if (order_items.length > 0) {

    order_items.forEach((item, index) => {
      const number = index + 1
      let dataRow = [
        number,
        item?.material?.name || '',
        item?.material?.unit || '',
        '',
        '',
        item?.stock_customer?.on_hand_stock || '',
        item?.qty ?? 0,
        item?.confirmed_qty ?? 0,
      ]

      if (process.env.APP_SERVICE === 'logistic') {
        dataRow.splice(3, 2)
      }

      let rowBatch = 0
      item?.order_stocks?.forEach((iitem) => {
        if (iitem?.batch) {
          rowBatch++
          if (rowBatch == 1) {
            dataRow.push(iitem?.allocated_qty || '')
            dataRow.push(iitem?.batch?.code || '')
            dataRow.push(iitem?.batch?.expired_date ? moment(iitem?.batch?.expired_date).format('DD/MM/YYYY') : '')
          } else {
            dataRows.push(dataRow)
            dataRow = [
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              iitem?.allocated_qty || '',
              iitem?.batch?.code || '',
              iitem?.batch?.expired_date ? moment(iitem?.batch?.expired_date).format('DD/MM/YYYY') : '',
            ]

            if (process.env.APP_SERVICE === 'logistic') {
              dataRow.splice(3, 2)
            }

          }
        }
      })

      dataRows.push(dataRow)
    })

    worksheet.addRows(dataRows)
  }

  worksheet.addRows([
    '', '', '',
    ['', `${req.__('report_header.nota_batch.created_by')},`, '', '', '', `${req.__('report_header.nota_batch.know')},`],
    '', '', '',
    ['', '_____________', '', '', '', '_____________'],
    '',
    [`${req.__('report_header.nota_batch.date')}:`, moment(data?.created_at).format('YYYY-MM-DD HH:mm:ss'), '', '', '', `${data?.user_created_by?.firstname} ${data?.user_created_by?.lastname || ''}`, `${req.__('report_header.nota_batch.date')}:`,]
  ])

  // adjust
  worksheet.mergeCells(1, 6, 1, 1)
  const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
  const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

  worksheet.getColumn('A').alignment = alignmentLeft
  worksheet.getColumn('F').alignment = alignmentLeft
  worksheet.getColumn('G').alignment = alignmentLeft
  worksheet.getColumn('H').alignment = alignmentLeft
  worksheet.getColumn('I').alignment = alignmentLeft
  worksheet.getColumn('J').alignment = alignmentLeft

  worksheet.getCell(1, 1).alignment = alignmentCenter

  const rowCount = new Array(dataRows.length + 1).fill(true)
  const colCount = new Array(colHeader.length).fill(true)

  let startRow = 10
  rowCount.forEach((_, i) => {
    let startCol = 0
    if (i > 0 && !dataRows[i - 1][0]) {
      startCol = 8
    }
    colCount.forEach((_, j) => {
      if (j >= startCol)
        worksheet.getCell(startRow, j + 1).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
    })
    startRow += 1
  })

  worksheet.getColumn('B').width = 17
  worksheet.getColumn('F').width = 32
  worksheet.getColumn('G').width = 17
  worksheet.getColumn('H').width = 21
  worksheet.getColumn('I').width = 21

  return workbook
}

export const yearlyPlanResultWorkbook = async (data) => {
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

        let titleCells = ['A1:P1', 'A2:P2', 'A3:P3', 'A5:A6', 'B5:B6', 'C5:C6', 'D5:D6', 'E5:I5', 'J5:U5']
        if (isVaccine) {
          titleCells = ['A1:P1', 'A2:P2', 'A3:P3', 'A5:A6', 'B5:B6', 'C5:C6', 'D5:D6', 'E5:L5', 'M5:X5']
        }
        titleCells.forEach((cell) => {
          worksheet.mergeCells(cell)
          worksheet.getCell(cell).alignment = alignmentCenter
        })
      }

      worksheet.getColumn(1).values = [`HASIL PERHITUNGAN KEBUTUHAN VAKSIN TAHUN ${data.year}`, `${data.regency_name}, ${data.province_name || ''}`, `MATERIAL: ${data.material.name}`, '', 'No']
      worksheet.getColumn(2).values = ['', '', '', '', 'Kabupaten Kota']
      worksheet.getColumn(3).values = ['', '', '', '', 'Puskesmas']
      worksheet.getColumn(4).values = ['', '', '', '', 'Indeks Pemakaian (IP)']

      if (isVaccine) {
        worksheet.getColumn(5).values = ['', '', '', '', `Kebutuhan ${data.material.name}`, '1 Tahun (vial)']
        worksheet.getColumn(6).values = ['', '', '', '', '', '1 Tahun (dosis)']
        worksheet.getColumn(7).values = ['', '', '', '', '', '1 Bulan (vial)']
        worksheet.getColumn(8).values = ['', '', '', '', '', '1 Bulan (dosis)']
        worksheet.getColumn(9).values = ['', '', '', '', '', '1 Minggu (vial)']
        worksheet.getColumn(10).values = ['', '', '', '', '', '1 Minggu (dosis)']
        worksheet.getColumn(11).values = ['', '', '', '', '', 'Min (dosis)']
        worksheet.getColumn(12).values = ['', '', '', '', '', 'Max (dosis)']
        worksheet.getColumn(13).values = ['', '', '', '', 'DISTRIBUSI PER BULAN (dalam dosis)', 'Jan']
      } else {
        worksheet.getColumn(5).values = ['', '', '', '', `Kebutuhan ${data.material.name}`, '1 Tahun']
        worksheet.getColumn(6).values = ['', '', '', '', '', '1 Bulan']
        worksheet.getColumn(7).values = ['', '', '', '', '', '1 Minggu']
        worksheet.getColumn(8).values = ['', '', '', '', '', 'Min']
        worksheet.getColumn(9).values = ['', '', '', '', '', 'Max']
        worksheet.getColumn(10).values = ['', '', '', '', 'DISTRIBUSI PER BULAN', 'Jan']
      }

      let startCol = isVaccine ? 14 : 11
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

export const workbookTargetRegency = async (req) => {
  // return workbook
  const workbook = new Excel.Workbook()

  const {
    condition = {},
    include,
    order,
  } = req

  const options = {
    order,
    where: condition,
  }

  if (include && typeof include === 'object') options.include = include

  const data = await models.MasterTargetRegency.findAll(options)

  workbook.creator = 'SMILE'
  const worksheetName = 'Master Data Sasaran Pusdatin'
  const worksheet = workbook.addWorksheet(worksheetName, {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: { firstHeader: worksheetName, firstFooter: worksheetName },
  })

  const masterTarget = await models.MasterTarget.findAll()
  const titleColumns = ['tahun', 'nama entitas']
  masterTarget.forEach((target) => {
    titleColumns.push(target.name)
  })
  worksheet.addRow(titleColumns)

  const regencyIDs = data.map((item) => item.entity_id)
    .filter((value, index, self) => self.indexOf(value) === index)
  const provinceIDs = data.map((item) => item.entity.province_id)
    .filter((value, index, self) => self.indexOf(value) === index)

  const regencyDatas = []
  regencyIDs.forEach((regency_id) => {
    const { year, entity, entity_id } = data.find((item) => item.entity_id === regency_id)
    const targets = []
    masterTarget.forEach((target) => {
      const { qty } = data.find((findEl) => findEl.entity_id === entity_id
        && findEl.year === year
        && findEl.master_target_id === target.id)
      if (qty) targets.push(qty)
    })
    regencyDatas.push({
      year,
      entity_name: entity.name,
      province_id: entity.province_id,
      targets,
    })
  })
  const provinceDatas = []
  provinceIDs.forEach((province_id) => {
    const { year, entity } = data.find((item) => item.entity.province_id === province_id)
    const targets = []
    masterTarget.forEach((target) => {
      let provQty = 0
      data.filter((findEl) => findEl.entity.province_id === province_id
        && findEl.year === year
        && findEl.master_target_id === target.id).forEach((item) => {
        if (item.qty) provQty += parseInt(item.qty)
      })
      targets.push(provQty)
    })
    provinceDatas.push({
      year,
      entity_name: entity.province.name,
      province_id: entity.province_id,
      targets,
    })
  })
  // let rows = []
  provinceDatas.forEach((provItem) => {
    const provRows = [
      provItem.year,
      provItem.entity_name,
    ]
    provItem.targets.forEach((provTarget) => { provRows.push(provTarget) })
    worksheet.addRow(provRows)
    regencyDatas
      .filter((reg) => reg.province_id === provItem.province_id)
      .forEach((regItem) => {
        const regRows = [
          regItem.year,
          regItem.entity_name,
        ]
        regItem.targets.forEach((regTarget) => { regRows.push(regTarget) })
        worksheet.addRow(regRows)
      })
  })

  return workbook
}

export const opnameStockWorkbook = async (datas) => {
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
    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }

      const titleCells = ['A1:B1', 'E1:H1', 'I1:L1', 'M1:P1', 'Q1:T1', 'U1:X1', 'C1:C2', 'D1:D2', 'Y1:Y2', 'Z1:Z2']

      titleCells.forEach((cell) => {
        worksheet.mergeCells(cell)
        worksheet.getCell(cell).alignment = alignmentCenter
      })
    }
    const titleRow1 = ['Periode', '', 'Entitas', 'Material']
    const titleRow2 = ['Dari', 'Ke', '', '']

    datas[0].opname_stock_items.forEach((item) => {
      titleRow1.push(item.stock_category_label, '', '', '')
      titleRow2.push('SMILE', 'Riil', 'Alasan', 'Aksi')
    })
    worksheet.addRow([...titleRow1, 'Dilakukan pada', 'Dilakukan oleh'])
    worksheet.addRow([...titleRow2])
    // console.log(titleRow1)
    datas.forEach((data) => {
      const resultData = [
        data.start_date,
        data.end_date,
        data.entity.name,
        data.material.name,
      ]

      let maxReason = 1
      data.opname_stock_items.forEach((opnameItem) => {
        resultData.push(
          opnameItem.smile_qty,
          opnameItem.real_qty,
          '',
          '',
        )
        if (opnameItem.reasons.length > maxReason) {
          maxReason = opnameItem.reasons.length
        }
      })
      // check reason multiple
      // console.log('check max reason', data.id, maxReason)
      let startKey = 6
      for (let i = 0; i < maxReason; i++) {
        data.opname_stock_items.forEach((opnameItem) => {
          resultData[startKey] = opnameItem.reasons[i]?.title || ''
          resultData[startKey + 1] = opnameItem.actions[i]?.title || ''
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
        startKey = 6
      }
    })
    _adjustCell()
    return workbook
  } catch (err) {
    console.log(err)
  }
}

const asikHeaders = (lang) => {
  if (lang === 'en') {
    return [
      'ID',
      'Province',
      'Regency',
      'Subdistrict',
      'Vendor',
      'Customer',
      'Material',
      'Activity',
      'Batch',
      'Manufacture',
      'Expired Date',
      'Status VVM',
      'Consumption of open vial (dose/pcs)',
      'Consumption of close vial (dose/pcs)',
      'Consumption Status',
      'Session ID',
      'Return of open vial (dose/pcs)',
      'Return of close vial (dose/pcs)',
      'Injection (person)',
      'Return Status',
      'Created At',
      'Created By'
    ]
  }
  return [
    'ID',
    'Provinsi',
    'Kab/Kota',
    'Kecamatan',
    'Nama Entitas',
    'Pelanggan',
    'Material',
    'Kegiatan',
    'Batch',
    'Produsen',
    'Tanggal Kedaluarsa',
    'Status VVM',
    'Pengeluaran Vial Terbuka (dosis/pcs/buah)',
    'Pengeluaran Vial Tertutup (dosis/pcs/buah)',
    'Status Pengeluaran',
    'Session ID',
    'Pengembalian Vial Terbuka (dosis/pcs/buah)',
    'Pengembalian Vial Tertutup (dosis/pcs/buah)',
    'Jumlah Penyuntikan (Orang)',
    'Status Pengembalian',
    'Dibuat Pada',
    'Dibuat Oleh'
  ]
}

export const asikWorkbook = async (datas, lang, name) => {
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

    const worksheet = workbook.addWorksheet(name, {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Report ASIK', firstFooter: 'Report ASIK' },
    })

    worksheet.columns = [
      { key: 'id' },
      { key: 'prov' },
      { key: 'kota' },
      { key: 'kec' },
      { key: 'entitas' },
      { key: 'pelanggan' },
      { key: 'material' },
      { key: 'kegiatan' },
      { key: 'batch' },
      { key: 'produsen' },
      { key: 'kadaluarsa' },
      { key: 'vvm' },
      { key: 'pengeluaranVialTerbuka' },
      { key: 'pengeluaranVialTertutup' },
      { key: 'statusPengeluaran' },
      { key: 'sessionID' },
      { key: 'pengembalianVialTerbuka' },
      { key: 'pengembalianVialTertutup' },
      { key: 'jumlahPenyuntikan' },
      { key: 'statusPengembalian' },
      { key: 'dibuatPada' },
      { key: 'dibuatOleh' },
    ]

    const headers = asikHeaders(lang)

    headers.forEach((title, idx) => {
      worksheet.getColumn(idx + 1).values = [title]
    })

    for (let index = 0; index < datas.length; index++) {
      const data = datas[index]
      worksheet.addRow({
        id: data.id,
        prov: data.province_name,
        kota: data.regency_name,
        kec: data.sub_district_name,
        entitas: data.vendor.name,
        pelanggan: data.customer.name,
        material: data.material.name,
        kegiatan: data.activity.name,
        batch: data.batch.code,
        produsen: data.batch.manufacture,
        kadaluarsa: data.batch.expired_date,
        vvm: data.status_vvm,
        pengeluaranVialTerbuka: data.consumed_qty_openvial,
        pengeluaranVialTertutup: data.consumed_qty_closevial,
        statusPengeluaran: data.consumed_status,
        sessionID: data.session_id,
        pengembalianVialTerbuka: data.return_qty_openvial,
        pengembalianVialTertutup: data.return_qty_closevial,
        jumlahPenyuntikan: data.injection_qty,
        statusPengembalian: data.return_status,
        dibuatPada: data.created_at,
        dibuatOleh: `${data.user_created.firstname} ${data.user_created.lastname || ''}`
      })
    }

    return workbook
  } catch (err) {
    console.log(err)
  }
}

export const transformDetail = (datas) => {
  return datas.map((data) => {
    return {
      id: data.id,
      prov: data.province_name,
      kota: data.regency_name,
      kec: data.sub_district_name,
      entitas: data.vendor?.name,
      pelanggan: data.customer?.name,
      material: data.material?.name,
      kegiatan: data.activity?.name,
      batch: data.batch?.code,
      produsen: data.batch?.manufacture,
      kadaluarsa: moment(data.batch?.expired_date).format('DD/MM/YYYY HH:mm:ss'),
      vvm: data.status_vvm,
      pengeluaranVialTerbuka: data.consumed_qty_openvial,
      pengeluaranVialTertutup: data.consumed_qty_closevial,
      statusPengeluaran: data.consumed_status_name,
      sessionID: data.session_id,
      pengembalianVialTerbuka: data.return_qty_openvial,
      pengembalianVialTertutup: data.return_qty_closevial,
      jumlahPenyuntikan: data.injection_qty,
      statusPengembalian: data.return_status_name,
      dibuatPada: moment(data.created_at).format('DD/MM/YYYY HH:mm:ss'),
      dibuatOleh: `${data.user_created?.firstname} ${data.user_created?.lastname || ''}`
    }
  })
}


export const reportPenerimaan = async (data, req = {}) => {
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

    const worksheet = workbook.addWorksheet(req.__('report'), {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: 'Laporan Penerimaan', firstFooter: 'Laporan Penerimaan' },
    })
    worksheet.properties.defaultColWidth = 11

    let startTable = 11
    const alignmentWrap = { wrapText: true, shrinkToFit: true }
    const fontBold = { bold: true }

    const shippedAt = data.shipped_at ? moment(data.shipped_at).format('DD/MM/YYYY HH:mm:ss') : ''

    const _adjustCell = function () {
      const alignmentCenter = { vertical: 'middle', horizontal: 'center' }
      const alignmentLeft = { vertical: 'middle', horizontal: 'left' }

      const mergeCells = [
        'A11:A13',
        'A6:B6',
        'A7:B7',
        'A8:B8',
        'E7:F7',
        'E8:F8',
        'B11:B13',
        'C11:C13',
        'D11:D13',
        'E11:E13',
        'F11:F13',
        'G11:G13'
      ]
      mergeCells.forEach((cells) => {
        worksheet.mergeCells(cells)
      })

      const setColWidths = [
        { key: 'B', width: 25 },
        { key: 'D', width: 25 },
        { key: 'F', width: 15 },
        { key: 'G', width: 18 },
        { key: 'H', width: 28 },
        { key: 'N', width: 17 },
        { key: 'I', width: 5 },
        { key: 'J', width: 5 },
        { key: 'K', width: 5 },
        { key: 'L', width: 5 },
        { key: 'O', width: 5 },
        { key: 'P', width: 5 },
        { key: 'Q', width: 5 },
        { key: 'R', width: 5 },
      ]
      setColWidths.forEach((col) => {
        const { key, width } = col
        worksheet.getColumn(key).width = width
      })

      let orderStockLength = 3
      data.order_items.forEach((item) => {
        orderStockLength += item.order_stocks.length
      })
      for (let i = 0; i < orderStockLength; i++) {
        const dataCell = worksheet.getCell(`A${startTable}`)
        dataCell.alignment = alignmentCenter

        const arrColumnData = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
        for (let j = 0; j < arrColumnData.length; j++) {
          const cellStr = arrColumnData[j]
          const dataCell = worksheet.getCell(`${cellStr}${startTable}`)

          dataCell.alignment = alignmentLeft
          dataCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          }
        }
        startTable++
      }
    }

    const customer = data.customer.name
    const vendor = data.vendor.name
    const activity = await models.MasterActivity.findByPk(data.activity_id)
    const activityName = activity ? activity.name : ''

    worksheet.columns = [
      { key: 'number' },
      { key: 'name' },
      { key: 'unit' },
      { key: 'price' },
      { key: 'volume' },
      { key: 'dosis' },
      { key: 'total_price' },
      { key: 'expired' },
      { key: 'batch' },
      { key: 'source' },
    ]

    const defaultRows = [
      [req.__('report_header.var.head1')],
      [''],
      [''],
      [''],
      [req.__('report_header.var.head2'), '', '', '', customer],
      [req.__('report_header.var.head3'), '', '', '', req.__('report_header.var.head4'), '', `${shippedAt}`, '', '', '', '', '', ''],
      [req.__('report_header.var.head6'), '', '', '', req.__('report_header.var.head7'), '', ''],
      [req.__('activity'), '', `${activityName}`, '', req.__('report_header.var.head8'), '', '', '', ''],
      ['', '', '', '', req.__('report_header.var.head5'), '', req.__('report_header.var.head20')],
      [''],
      ['No', req.__('report_header.var.head9'), req.__('report_header.var.head10'), req.__('report_header.var.head11'), req.__('report_header.var.head12'), req.__('report_header.var.head13'), req.__('report_header.var.head14')],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ]
    for (let rows = 1; rows <= defaultRows.length; rows++) {
      const selectedRow = worksheet.getRow(rows)
      selectedRow.values = defaultRows[rows - 1]
      if (rows >= startTable) {
        selectedRow.height = 25
        selectedRow.alignment = alignmentWrap
      }
    }

    let totalBatches = 0
    for (let index = 0; index < data.order_items.length; index++) {
      const items = data.order_items[index]
      items.order_stocks.forEach((orderStock) => {
        const { batch } = orderStock
        totalBatches++
        worksheet.addRow([
          index + 1,
          items?.master_material?.name || items?.material?.master_material?.name,
          '',
          '',
          orderStock.allocated_qty,
          batch ? batch.code : '',
          batch ? formatDateByTimezone(batch.expired_date) : '',
          '',
          '',
          '',
          '',
          '',
        ])
      })
    }

    const infoRows = [
      [''],
      ['', req.__('report_header.var.info1')],
      ['', req.__('report_header.var.info2'), '', '', req.__('report_header.var.info6'), ''],
      ['', req.__('report_header.var.info3'), '', '', req.__('report_header.var.info7'), ''],
      ['', req.__('report_header.var.info4')],
      ['', req.__('report_header.var.info5')],
      [''],
      ['', '', '', req.__('report_header.var.info8'), '', '', req.__('report_header.var.info9')],
      ['', '', '', vendor, '', '', customer],
    ]
    infoRows.forEach((infoRow) => {
      worksheet.addRow(infoRow)
    })
    worksheet.getCell('A1').font = fontBold
    const footerRow = 13 + totalBatches
    worksheet.getCell(`B${footerRow}`).font = fontBold

    _adjustCell()

    return workbook
  } catch (err) {
    console.log(err)
  }
}

export const exportExcelColdStorageDetail = (data) => {
  const workbook = new Excel.Workbook()
  workbook.creator = 'Smile'
  workbook.created = new Date()
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

  const worksheet = workbook.addWorksheet(__('coldstorage.detail'))

  /* Filter */
  const assetsName = data.assets.map((asset) => {
    return `${asset.serial_number} - ${asset.capacity_nett} Liter`
  })

  const columnOne = worksheet.getColumn(1)
  columnOne.values = ['', '', __('field.entity.name'), __('coldstorage.total_volume'), __('coldstorage.percentage_capacity')]

  const columnTwo = worksheet.getColumn(2)
  columnTwo.width = 16
  columnTwo.values = ['', '', data.entity.name, data.total_volume, `${data.percentage_capacity}%`]

  const columnFour = worksheet.getColumn(4)
  columnFour.values = ['', '', __('field.asset.name'), __('coldstorage.neto_asset')]

  const columnFive = worksheet.getColumn(5)
  columnFive.width = 16
  columnFive.values = ['', '', assetsName.join(', '), data.volume_asset]

  const filterLabelColumnsAdress = ['A3', 'A4', 'A5', 'D3', 'D4']
  filterLabelColumnsAdress.forEach((address) => {
    worksheet.getCell(address).font = {
      bold: true
    }
  })


  /*
    Title
    It sets after the filter because the above code empty the first row
  */
  worksheet.mergeCells('A1:G1')
  const header = worksheet.getCell('A1')
  header.value = __('coldstorage.detail')
  header.alignment = { vertical: 'middle', horizontal: 'center' }
  header.font = { bold: true }
  header.border = {
    top: { style: 'thick' },
    left: { style: 'thick' },
    bottom: { style: 'thick' },
    right: { style: 'thick' },
  }

  /* Header Column */
  const row = worksheet.getRow(7)
  row.alignment = { vertical: 'middle' }
  row.values = [
    'No',
    __('coldstorage.material_name'),
    __('coldstorage.stock_dose'),
    __('coldstorage.stock_vial'),
    __('coldstorage.stock_boks'),
    __('coldstorage.stock_volume'),
    __('coldstorage.stock_box')
  ]

  /* eslint no-param-reassign: ["error", { "props": false }] */
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF004990' },
    }
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    cell.alignment = {
      vertical: 'middle',
    }
  })

  data.coldstorage_materials.forEach((datum, idx) => {
    const rowData = worksheet.addRow([
      idx + 1,
      datum.master_material.name,
      noMinus(datum.dosage_stock),
      noMinus(datum.vial_stock),
      noMinus(datum.package_stock),
      noMinus(datum.package_volume),
      noMinus(datum.remain_package_fulfill),
    ])

    rowData.getCell(1).alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }
  })

  return workbook
}

export const exportExcelColdStorageDetailDinkes = (data) => {
  const workbook = new Excel.Workbook()
  workbook.creator = 'Smile'
  workbook.created = new Date()
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

  const worksheet = workbook.addWorksheet(__('coldstorage.detail'))

  /* Header Column */
  const row = worksheet.getRow(12)
  row.alignment = { vertical: 'middle' }
  row.values = [
    __('coldstorage.range_temperature'),
    'No',
    __('coldstorage.material_name'),
    __('coldstorage.stock_dose'),
    __('coldstorage.stock_vial'),
    __('coldstorage.stock_boks'),
    __('coldstorage.stock_volume'),
    __('coldstorage.stock_box'),
    __('coldstorage.stock_max_dosage'),
    __('coldstorage.stock_recommendation'),
    __('coldstorage.stock_projection'),
  ]

  /* eslint no-param-reassign: ["error", { "props": false }] */
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF004990' },
    }
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
    }
    cell.alignment = {
      vertical: 'middle',
    }
  })

  const dataMaterial = data.coldstorage_materials.sort((a, b) => {
    if (a.master_material.range_temperature_id === null) return 1 // Place null at the end
    if (b.master_material.range_temperature_id === null) return -1 // Place null at the end
    return a.master_material.range_temperature_id - b.master_material.range_temperature_id // Sort by numeric value
  })

  const rangeTemperatureExist = {}
  // Define the columns to be formatted to two decimal places
  const decimalColumns = [4, 5, 6, 7, 8, 9, 10, 11]

  dataMaterial.forEach((datum, idx) => {
    let temp = null
    if (!rangeTemperatureExist[datum.master_material.range_temperature_id]) {
      if (datum.master_material.range_temperature_id) {
        let { min_temp, max_temp } = datum.master_material.range_temperature.dataValues
        min_temp = min_temp < 0 ? `(${min_temp}℃)` : `${min_temp}℃`
        max_temp = max_temp < 0 ? `(${max_temp}℃)` : `${max_temp}℃`
        temp = `${min_temp} - ${max_temp}`
      } else temp = __('coldstorage.other')
      rangeTemperatureExist[datum.master_material.range_temperature_id] = temp
    }
    const rowData = worksheet.addRow([
      temp,
      idx + 1,
      datum.master_material.name,
      noMinus(datum.dosage_stock),
      noMinus(datum.vial_stock),
      noMinus(datum.package_stock),
      noMinus(datum.package_volume),
      noMinus(datum.remain_package_fulfill),
      noMinus(datum.max_dosage),
      noMinus(datum.recommend_order_base_on_max),
      noMinus(datum.projection_stock),
    ])

    rowData.getCell(1).alignment = {
      vertical: 'middle',
      horizontal: 'left',
    }

    // Format specific cells to two decimal places if they have decimal points
    decimalColumns.forEach(col => {
      const cell = rowData.getCell(col)
      const value = cell.value

      if (typeof value === 'number' && value % 1 !== 0) {
        cell.numFmt = '0.00'  // Set the number format to two decimal places
      }
    })
  })

  /* Header Total */
  const assetsName = data.assets.map((asset) => {
    return `${asset.serial_number} - ${asset.capacity_nett} Liter`
  })

  const dataColdstoragePerTemperature = {}
  data.coldstorage_per_temperature.forEach(element => {
    dataColdstoragePerTemperature[Number(element.range_temperature_id)] = element.dataValues
  })

  const columnOne = worksheet.getColumn(1)
  columnOne.values = [
    '',
    '',
    __('field.entity.name'),
    __('coldstorage.asset_coldchain'),
    __('coldstorage.range_temperature'),
    __('coldstorage.total_volume_real'),
    __('coldstorage.netto_total_asset_real'),
    __('coldstorage.capacity_used_real'),
    __('coldstorage.projection_total_volume'),
    __('coldstorage.projection_capacity_used'),
  ]

  const columnTwo = worksheet.getColumn(2)
  columnTwo.values = [
    '', 
    '', 
    data.entity.name, 
    assetsName.join(',\n'), 
    '2℃ - 8℃',
    dataColdstoragePerTemperature[1]?.total_volume ? dataColdstoragePerTemperature[1].total_volume : 0,
    dataColdstoragePerTemperature[1]?.volume_asset ? dataColdstoragePerTemperature[1].volume_asset : 0,
    dataColdstoragePerTemperature[1]?.percentage_capacity ? dataColdstoragePerTemperature[1].percentage_capacity: 0,
    dataColdstoragePerTemperature[1]?.projection_total_volume ? dataColdstoragePerTemperature[1].projection_total_volume : 0,
    dataColdstoragePerTemperature[1]?.projection_percentage_capacity ? dataColdstoragePerTemperature[1].projection_percentage_capacity: 0,
  ]

  const columnThree = worksheet.getColumn(3)
  columnThree.values = [
    '', 
    '', 
    '', 
    '', 
    '(-25℃) - (-15℃)',
    dataColdstoragePerTemperature[2]?.total_volume ? dataColdstoragePerTemperature[2].total_volume : 0,
    dataColdstoragePerTemperature[2]?.volume_asset ? dataColdstoragePerTemperature[2].volume_asset : 0,
    dataColdstoragePerTemperature[2]?.percentage_capacity ? dataColdstoragePerTemperature[2].percentage_capacity: 0,
    dataColdstoragePerTemperature[2]?.projection_total_volume ? dataColdstoragePerTemperature[2].projection_total_volume : 0,
    dataColdstoragePerTemperature[2]?.projection_percentage_capacity ? dataColdstoragePerTemperature[2].projection_percentage_capacity: 0, 
  ]

  const cellToFormatLiter = ['B6', 'B7', 'B9', 'C6', 'C7', 'C9']
  // Format specific cells to two decimal places if they have decimal points
  cellToFormatLiter.forEach(col => {
    const cell = worksheet.getCell(col)
    const value = cell.value

    if (typeof value === 'number' && value % 1 !== 0) {
      cell.numFmt = '0.00" L"'  // Set the number format to two decimal places with " L"
    } else {
      cell.numFmt = '0" L"'  // Set the number format to integer with " L"
    }
  })

  const cellToFormatPersen = ['B8', 'B10', 'C8', 'C10']
  // Format specific cells to two decimal places if they have decimal points
  cellToFormatPersen.forEach(col => {
    const cell = worksheet.getCell(col)
    const value = cell.value

    if (typeof value === 'number' && value % 1 !== 0) {
      cell.numFmt = '0.00" %"'  // Set the number format to two decimal places
    } else {
      cell.numFmt = '0" %"'
    }
  })

  worksheet.getCell('A4').alignment = { horizontal: 'left', vertical: 'top' }
  worksheet.getCell('B4').alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
  worksheet.mergeCells('B4:C4')

  // Fungsi untuk menambahkan border ke setiap sel di baris tertentu
  const addBorderToRow = (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  }

  // Menambahkan border ke baris pertama dan kedua
  for (let i = 5; i <= 10; i++) { addBorderToRow(worksheet.getRow(i)) }
  
  worksheet.getRow(5).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC000' },
    }
    cell.font = {
      bold: true,
      color: { argb: '000000' },
    }
    cell.alignment = {
      vertical: 'middle',
    }
  })

  worksheet.getCell('B5').alignment = { vertical: 'middle', horizontal: 'center' }
  worksheet.getCell('C5').alignment = { vertical: 'middle', horizontal: 'center' }
  /*
    Title
    It sets after the filter because the above code empty the first row
  */
  worksheet.mergeCells('A1:K1')
  const header = worksheet.getCell('A1')
  header.value = __('coldstorage.detail')
  header.alignment = { vertical: 'middle', horizontal: 'center' }
  header.font = { bold: true }
  header.border = {
    top: { style: 'thick' },
    left: { style: 'thick' },
    bottom: { style: 'thick' },
    right: { style: 'thick' },
  }

  // Mengatur lebar kolom A sampai K menjadi 20
  const columns = Array.from({ length: 11 }, (_, i) => ({
    key: String.fromCharCode(65 + i),  // 'A'.charCodeAt(0) = 65
    width: 25
  }))
  worksheet.columns = columns

  // Fungsi untuk mengatur tinggi baris secara dinamis berdasarkan jumlah baris teks dalam sel
  const setRowHeightDynamically = (indexRow) => {
    const thisRow = worksheet.getRow(indexRow)
    let maxLines = 1
    thisRow.eachCell({ includeEmpty: true }, (cell) => {
      const numberOfLines = (cell.value.match(/\n/g) || []).length + 1
      if (numberOfLines > maxLines) maxLines = numberOfLines
    })
    thisRow.height = maxLines * 20 // Adjust multiplier as needed for line height
  }
  setRowHeightDynamically(4)

  return workbook
}