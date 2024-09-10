
let shipmentData = {
  'flow_id': 1,
  'activity_id': 6,
  'vendor_code': '3323KODE',
  'customer_code': '3300000001',
  'is_allocated': 1,
  'no_document': 'abc',
  'order_comment': {
    'comment': 'def'
  },
  'type': 5,
  'order_items': [
    {
      'material_id': 48,
      'material_name': 'PFIZER 1 VIAL @ 6 DOSIS (COVAX)',
      'ordered_qty': 12,
      'stocks': [
        {
          'stock_id': 1001252,
          'batch': {
            'id': 2096,
            'code': 'BUANG03'
          },
          'activity_id': 6,
          'activity_name': 'COVID-19',
          'stock_qty': 6,
          'stock_exterminations': [
            {
              'stock_extermination_id': 255,
              'transaction_reason_title': 'Beku',
              'received_qty': 0,
              'discard_qty': 6
            }
          ]
        },
        {
          'stock_id': 1001332,
          'batch': {
            'id': 2128,
            'code': '0408202201'
          },
          'activity_id': 6,
          'activity_name': 'COVID-19',
          'stock_qty': 6,
          'stock_exterminations': [
            {
              'stock_extermination_id': 64,
              'transaction_reason_title': 'Rusak',
              'received_qty': 6,
              'discard_qty': 0
            }
          ]
        }
      ]
    }
  ]
}

export {
  shipmentData
}