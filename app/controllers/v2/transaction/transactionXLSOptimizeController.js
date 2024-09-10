import stream from 'stream'

import { commonLists } from '../../../helpers/xls/excelTemplate'
import { getOrderStatusLabel } from '../../../helpers/constants'
import { formatWIB } from '../../../helpers/common'
import { getTransactionsData } from './transactionController'

export async function exportExcel(req, res, next) {
  try {
    const {
      queryParam = {}
    } = req

    const {
      logistik
    } = req

    const transactions = await getTransactionsData(queryParam)

    const data = []
    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index]

      const { transaction_reason } = transaction

      const user = transaction.user_created
      let transactionReasonLabel = ''
      if (transaction_reason) {
        transactionReasonLabel = transaction_reason.is_other ? `${transaction_reason.title}, ${transaction.other_reason}` : transaction_reason.title
      }

      const { transaction_purchase } = transaction
      let transactionPurchase = {}
      if (transaction_purchase) {
        transactionPurchase = {
          source_material: transaction_purchase?.source_material?.name || '',
          year: transaction_purchase?.year || '',
          price: transaction_purchase?.price || '',
          pieces_purchase: transaction_purchase?.pieces_purchase?.name || ''
        }
      }
      
      data.push({
        entity_id: transaction.entity_id,
        entity_name: transaction?.entity?.name || '',
        material_id: transaction?.master_material?.id || '',
        material_name: transaction?.master_material?.name || '',
        activity_name: transaction?.activity?.name || '',
        customer_name: transaction?.customer?.name || '',
        vendor_name: transaction?.vendor?.name || '',
        order_id: transaction.order_id || '',
        order_status: transaction.order ? getOrderStatusLabel(transaction.order.status) : '',
        order_type: transaction.order?.type || '',
        opening_stock: transaction.opening_qty,
        quantity: transaction.change_qty,
        closing_stock: transaction.closing_qty,
        transaction_type: transaction?.transaction_type?.title || '',
        transaction_reason: transactionReasonLabel,
        stock_in_hand: transaction?.stock?.available || '',
        min: transaction?.stock?.material_entity?.min || '',
        max: transaction?.stock?.material_entity?.max || '',
        allocated_stock: transaction?.stock?.allocated || '',
        batch_code: transaction?.stock?.batch?.code || '',
        stock_in_batch: transaction?.stock?.qty || '',
        stock_activity_name: transaction?.stock?.activity_name || '',
        batch_expiry: transaction?.stock?.batch?.expired_date || '',
        batch_manufacturer: transaction?.stock?.batch?.manufacture_name || '',
        created_by: user?.firstname ? `${user.firstname} ${user.lastname ? user.lastname : ''}` : '',
        created_at: formatWIB(transaction.createdAt, 'YYYY-MM-DD HH:mm'),
        dose_1: transaction?.injection?.dose_1 || '',
        dose_2: transaction?.injection?.dose_2 || '',
        dose_booster: transaction?.injection?.dose_booster || '',
        dose_routine: transaction?.injection?.dose_routine || '',
        ...transactionPurchase
      })
      
    }

    let columns = [
      { key: 'entity_id', title: 'Entity ID' },
      { key: 'entity_name', title: 'Entity Name' },
      { key: 'material_id', title: 'Material ID' },
      { key: 'material_name', title: 'Material Name' },
      { key: 'activity_name', title: 'Activity Name' },
      { key: 'opening_stock', title: 'Opening Stock' },
      { key: 'quantity', title: 'Quantity' },
      { key: 'closing_stock', title: 'Closing Stock' },
      { key: 'transaction_type', title: 'Transaction Type' },
      { key: 'transaction_reason', title: 'Transaction Reason' },
      { key: 'customer_name', title: 'Customer Name' },
      { key: 'vendor_name', title: 'Vendor Name' },
      { key: 'order_id', title: 'Order ID' },
      { key: 'order_status', title: 'Order Status' },
      { key: 'order_type', title: 'Order Type' },
      { key: 'stock_in_hand', title: 'Stock on Hands' },
      { key: 'stock_activity_name', title: 'Taken from activities' },
      { key: 'min', title: 'Min.' },
      { key: 'max', title: 'Max.' },
      { key: 'allocated_stock', title: 'Allocated Stock' },
      { key: 'batch_code', title: 'Batch Code' },
      { key: 'stock_in_batch', title: 'Stock in Batch' },
      { key: 'batch_expiry', title: 'Batch Expiry' },
      { key: 'batch_manufacturer', title: 'Batch Manufacture' },
      { key: 'created_by', title: 'Created by Full Name' },
      { key: 'created_at', title: 'Created at' },
    ]

    if (!logistik) {
      columns.push({ key: 'dose_1', title: 'Dose 1' })
      columns.push({ key: 'dose_2', title: 'Dose 2' })
      columns.push({ key: 'dose_booster', title: 'Dose Booster' })
      columns.push({ key: 'dose_routine', title: 'Dose Routine' })
    } else {
      columns.push({ key: 'source_material', title: 'Source Material' })
      columns.push({ key: 'year', title: 'Year of Source' })
      columns.push({ key: 'price', title: 'Price' })
      columns.push({ key: 'pieces_purchase', title: 'Piece per Price' })
    }

    const workbook = commonLists(data, columns, 'Transaksi')

    const filename = `Transactions ${Date()}`

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const readStream = new stream.PassThrough()
    readStream.end(arrayBuffer)
    res.writeHead(200, {
      'Content-Length': arrayBuffer.length,
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      'Access-Control-Expose-Headers': 'Filename',
      Filename: `${filename}.xlsx`,
    })

    return readStream.pipe(res)
  } catch (err) {
    next(err)
  }
}
