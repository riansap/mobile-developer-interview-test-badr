import express from 'express'
import rateLimit from 'express-rate-limit'

import * as orderController from '../controllers/orderController'
import * as commonController from '../controllers/commonController'
import * as orderStatusController from '../controllers/orderStatusController'
import * as orderReportController from '../controllers/orderReportController'
import * as orderBPOMController from '../controllers/orderBPOMController'
import parameterModel from '../helpers/parameterModel'

import { validate } from '../validators'
import * as orderValidator from '../validators/orderValidator'
import * as orderStatusValidator from '../validators/orderStatusValidator'

import { hasRole, notHasRole } from '../middlewares/authMiddleware'
import { ORDER_STATUS, ORDER_TYPE, USER_ROLE } from '../helpers/constants'

import { downloadData } from '../controllers/excelController'

import { limitterOptions } from '../helpers/services/rateLimiterHelper'

import { reportStatuses, eventReportsFilter, eventReportExcel } from '../controllers/eventReport/eventReportController'

import eventReportReasonRouter from './event-report/eventReportReasonRouter'
import eventReportReasonChildRouter from './event-report/eventReportChildReasonRouter'
import eventReportRouter from './event-report/eventReportRouter'

const orderRouter = express.Router()
const orderRouterIOT = express.Router()

const allocateLimiter = rateLimit(limitterOptions)
const confirmLimiter = rateLimit(limitterOptions)
const shipLimiter = rateLimit(limitterOptions)
const fulfillLimiter = rateLimit(limitterOptions)
const cancelLimiter = rateLimit(limitterOptions)
const pendingLimiter = rateLimit(limitterOptions)
const orderStatusLimiter = rateLimit(limitterOptions)

orderRouter.get(
  '/event-report-reasons/',
  parameterModel.define('EventReportReason'),
  commonController.list,
)

orderRouter.get(
  '/event-report-child-reasons',
  parameterModel.define('EventReportChildReason'),
  commonController.filterQuery(['parent_id']),
  commonController.list,
)

orderRouter.get(
  '/event-reports/',
  parameterModel.custom('EventReport', eventReportsFilter),
  commonController.list,
)

orderRouter.get(
  '/event-reports/xls',
  parameterModel.custom('EventReport', eventReportsFilter),
  eventReportExcel,
)

orderRouter.get(
  '/event-report-statuses/',
  reportStatuses,
)

/* Order Model. */
/**
 * @typedef Order
 * @property {number} customer_id.required - 1 - Customer id - eg:1
 * @property {number} vendor_id.required - 1 - Vendor id - eg:1
 * @property {number} status.required - 2 - Status pesanan [pending: 1, confirmed: 2, shipped: 3, fulfilled: 4, cancelled: 5] - eg:1
 * @property {number} type.required - 1 - tipe pesanan [normal: 1, dropping: 2] - eg:1
 * @property {string} required_date.required - Tanggal dibutuhkan - eg:2020-12-31
 * @property {string} estimated_date - estimasi tanggal - eg:2020-12-31
 * @property {string} purchase_ref - referensi pembelian - eg:#PURCHASEREF
 * @property {string} sales_ref - referensi penjualan - eg:#SREF
 * @property {integer} reason - [1: kekurangan pasokan, 2: pertambahan penduduk, 3: wabah] - eg:1
 * @property {Array.<OrderItem>} order_items - array object [{material_id: 1, ordered_qty: 100}]
 * @property {Array.<integer>} order_tags - array number [1, 2]
 * @property {OrderComment.model} order_comment - array object [{comment: '123'}]
 */

/* Order Item Model */
/**
 * @typedef InsertOrderItem
 * @property {Array.<OrderItem>} order_items - array object [{material_id: 1, ordered_qty: 100}]
 */

/* OrderUpdate Model. */
/**
 * @typedef OrderUpdate
 * @property {string} required_date - Tanggal dibutuhkan - eg:2020-12-31
 * @property {string} purchase_ref - referensi pembelian - eg:#PURCHASEREF
 * @property {integer} reason - [1: kekurangan pasokan, 2: pertambahan penduduk, 3: wabah] - eg:1
 * @property {Array.<OrderItemUpdate>} order_items - array object [{material_id: 1, ordered_qty: 100}]
 * @property {Array.<integer>} order_tags - array number [1, 2] - eg: [1, 2]
 * @property {OrderComment.model} order_comment - object
 */

/* OrderItem Model. */
/**
 * @typedef OrderItem
 * @property {integer} material_id - 1 - Customer id - eg:1
 * @property {integer} ordered_qty - estimasi tanggal - eg:100
 * @property {integer} recommended_stock - rekomendasi stock - eg:100
 * @property {integer} reason_id - Reason ID () - eg: 1
 * @property {string} other_reason - Other Reason - eg:Text
 */

/* OrderItemUpdate Model. */
/**
 * @typedef OrderItemUpdate
 * @property {integer} id - 1 - id order item - eg:1
 * @property {integer} ordered_qty - estimasi tanggal - eg:100
 * @property {integer} reason_id - Reason ID () - eg: 1
 * @property {string} other_reason - Other Reason - eg:Text
 */

/* BatchItemCovid Model. */
/**
 * @typedef BatchItemCovid
 * @property {string} code - BATCHCODE123 - batch cod - eg:BATCHCODE123
 * @property {string} expired_date - tanggal kadaluarsa - eg:2020-12-31
 * @property {string} production_date - tanggal produksi - eg:2020-12-31
 * @property {string} manufacture_name - nama manufaktur - eg:Biofarma
 * @property {integer} qty - 100 - eg:100
 */

/* OrderItemCovid Model. */
/**
 * @typedef OrderItemCovid
 * @property {string} material_code - SINOVAC - Customer id - eg:SINOVAC
 * @property {Array.<BatchItemCovid>} batches - array object
 */

/* OrderComment Model. */
/**
 * @typedef OrderComment
 * @property {string} comment - 1 - Comment - eg:Put your comment here
 */

/* OrderCovid Model. */
/**
 * @typedef OrderCovid
 * @property {string} customer_code.required - customer code - eg:DNKSJBR
 * @property {string} estimated_date - estimasi tanggal - eg:2020-12-31
 * @property {string} sales_ref - referensi penjualan - eg:#SREF
 * @property {string} delivery_number - nomor pengiriman - eg:#123-REGJKT
 * @property {integer} is_allocated - is_allocated - eg:1
 * @property {integer} type - Type (2. Dropping, 3. Pengembalian) - eg: 2
 * @property {OrderComment.model} order_comment - Order Comment
 * @property {Array.<OrderItemCovid>} order_items - array object [{material_id: 1, ordered_qty: 100}]
 */

/* GET order listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders
 * @group Order - Operations about order
 * @param {integer} entityId.query - id entitas
 * @param {string} vendorId.query - id vendor
 * @param {integer} customerId.query - id cutomer
 * @param {string} ordered_number.query - ordered number
 * @param {string} purchase_ref.query - purchase reference
 * @param {string} sales_ref.query - sales reference
 * @param {integer[]} tags.query - array string id tags
 * @param {string} type.query - type order {NORMAL 1, DROPPING 2}
 * @param {string} purpose.query - [purchase, sales] string
 * @param {integer} status.query - status order
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @param {integer} entity_tag_id.query - entity tag id
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [
 *      {
 *        "customer_id": 1,
 *        "vendor_id": 2,
 *        "type": 1,
 *        "required_date": "",
 *        "purchase_ref": "123abc",
 *        "order_items": [],
 *        "order_tags": [],
 *        "order_comments": []
 *      }
 * ]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET order tag listing. */
/**
 * This function comment is parsed by doctrine
 * // @route GET /orders
 * @group Order - Operations about order
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{
 *     "id": 1,
 *     "customer_id": 1,
 *     "vendor_id": 1,
 *     "status": 1,
 *     "type": 1,
 *     "required_date": "",
 *     "estimated_date": "",
 *     "purchase_ref": "",
 *     "sales_ref": ""
 *   }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* POST order creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /order
 * @group Order - Operations about order
 * @param {Order.model} data.body Create - Order
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */

orderRouter.post('/',
  notHasRole(['ADMIN']),
  validate(orderValidator.create),
  orderController.create)

/* PUT order updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}
 * @param {id} id.path - id order
 * @group Order - Operations about update order
 * @param {OrderUpdate.model} data.body Create - Order
 * @returns {object} 200 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */
orderRouter.put('/:id',
  // notHasRole(['ADMIN']),
  orderStatusLimiter,
  validate(orderValidator.update),
  orderController.update)

/* order detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /order/{id}
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @returns {object} 201 - {
 *      "customer_id": 1,
 *      "vendor_id": 2,
 *      "type": 1,
 *      "required_date": "",
 *      "purchase_ref": "123abc",
 *      "order_items": [
 *              {
 *                      "material_id": 1,
 *                      "ordered_qty": 100
 *              },
 *              {
 *                      "material_id": 2,
 *                      "ordered_qty": 150
 *              }
 *      ],
 *      "order_tags": [1, 2],
 *      "order_comment": {
 *              "comment": "ini vaksinnya bagus"
 *      }
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

orderRouter.get('/:id',
  // parameterModel.custom('Order', orderController.detail),
  // commonController.detail
  orderController.detail)

/* POST order covid creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /order/covid
 * @group Order - Operations about order covid
 * @param {OrderCovid.model} data.body Create - OrderCovid
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */
orderRouter.post(
  '/covid',
  (req, res, next) => {
    if (req.user.role === USER_ROLE.PKC) req.body.is_allocated = 0
    next()
  },
  validate(orderValidator.createCovid),
  orderController.createCovid,
)

/* POST order rutin creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /order/rutin
 * @group Order - Operations about order rutin
 * @param {OrderCovid.model} data.body Create - OrderCovid
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */
orderRouter.post(
  '/rutin',
  (req, res, next) => {
    req.body.type = ORDER_TYPE.RUTIN_ALLOCATION
    next()
  },
  validate(orderValidator.createCovid),
  orderController.createCovid,
)

/* GET order item listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /order/{id}/order-items
 * @group Order - Operations about order order-items
 * @param {id} id.path - id order
 * @returns {object} 200 - [
 * {
 *   "allocated": 0,
 *   "stock_vendor": null,
 *   "stock_customer": {
 *     "on_hand_stock": 110,
 *     "id": 75,
 *     "min": 50,
 *     "max": 1000,
 *     "entity_id": 3,
 *     "stock_update": "2020",
 *     "sum_stock": 431,
 *     "allocated_stock": 321
 *   },
 *   "shipped": s0,
 *   "not_yet_shipped": 0,
 *   "id": 15,
 *   "order_id": 10,
 *   "material_id": 1,
 *   "qty": null,
 *   "material": {
 *     "id": 1,
 *     "name": "BCG",
 *     "description": "BCG",
 *     "pieces_per_unit": 20,
 *     "unit": "Ampul",
 *     "temperature_sensitive": 1,
 *     "temperature_min": 2,
 *     "temperature_max": 8,
 *     "managed_in_batch": 1
 *   },
 *   "order_stocks": [
 *     {
 *       "id": 15,
 *       "stock_id": 1,
 *       "status": null,
 *       "allocated_qty": 0,
 *       "received_qty": 10,
 *       "ordered_qty": 100,
 *       "fulfill_reason": null,
 *       "other_reason": null
 *     }
 *   ],
 *   "user_created_by": {},
 *   "user_updated_by": {},
 *   "user_deleted_by": null
 *  }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

orderRouter.get('/:id/order-items',
  parameterModel.custom('OrderItem', orderController.orderItem),
  commonController.unlimitedList)

/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/order-items
 * @group Order - Operations about insert order items
 * @param {id} id.path - id order
 * @param {InsertOrderItem.model} data.body insert - order item
 * @returns {object} 200 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[], "timezone":[]}]
 */

orderRouter.put('/:id/order-items',
  // notHasRole(['ADMIN']),
  validate(orderValidator.insertOrderItem),
  orderController.insertOrderItem)

/* Order Allocated Model. */
/**
 * @typedef OrderAllocated
 * @property {integer} status - Status Allocated Stock - eg:1
 * @property {integer} order_item_id - Order Item ID - eg:1
 * @property {integer} allocated_stock_id - Allocated Stock ID - eg:1
 * @property {integer} allocated_qty - Allocated Qty - eg:50
 */

/* PUT order allocate. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/allocate
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @param {Array.<OrderAllocated>} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/allocate',
  // notHasRole(['ADMIN']),
  allocateLimiter,
  validate(orderStatusValidator.allocate),
  orderStatusController.allocateStock)

/* GET order comment listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /order/{id}/comments
 * @group Order - Operations about order comments
 * @param {id} id.path - id order
 * @returns {object} 200 - [
 *   {
 *     "order_id": 1,
 *     "user_id": 1,
 *    }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouter.get('/:id/comments',
  parameterModel.define('OrderComment'),
  commonController.list)

/* POST order covid creating. */
/**
 * This function comment is parsed by doctrine
 * @group Order - Operations about order covid
 * @route POST /order/{id}/comment
 * @param {id} id.path - id order
 * @param {OrderComment.model} data.body Create - OrderCovid
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */
orderRouter.post('/:id/comment',
  // notHasRole(['ADMIN']),
  validate(orderValidator.comment),
  parameterModel.custom('OrderComment', orderController.insertComment),
  commonController.create)

/* OrderStatus Model. */
/**
 * @typedef OrderStatus
 * @property {string} comment - Komentar - eg:Alasan atau Komentar
 */

/* OrderConfirm Model. */
/**
 * @typedef OrderConfirm
 * @property {Array.<OrderItemConfirm>} order_items - OrderItemConfirm - eg:array
 * @property {string} comment - Komentar - eg:Alasan atau Komentar
 */

/**
 * @typedef OrderItemConfirm
 * @property {integer} id - OrderItem - eg:1
 * @property {integer} order_id - order_id - eg:1
 * @property {integer} material_id - material_id - eg:1
 * @property {integer} qty - qty - eg:10
 * @property {integer} confirmed_qty - qty - eg:10
 */

/* PUT order confirm. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/confirm
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @param {OrderConfirm.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/confirm',
  // notHasRole(['ADMIN']),
  confirmLimiter,
  orderStatusController.setStatus(ORDER_STATUS.CONFIRMED),
  validate(orderStatusValidator.confirm),
  orderStatusController.updateStatus)

/* Track Device Model. */
/**
 * @typedef TrackDevice
 * @property {integer} id - ID - eg:1
 * @property {string} nopol - Nopol - eg:UNDP01
 */

/* Order Shipment Model. */
/**
 * @typedef OrderShipment
 * @property {string} comment - Komentar - eg:Komentar
 * @property {string} estimated_date - estimasi tanggal - eg:2020-12-31
 * @property {integer} taken_by_customer - taken_by_customer(0/1) - eg:0
 * @property {comment} sales_ref - referensi penjualan - eg:#SAF100
 * @property {TrackDevice.model} track_device - tracking device
 */

/* PUT order ship. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/ship
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @param {OrderShipment.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/ship',
  // notHasRole(['ADMIN']),
  shipLimiter,
  orderStatusController.setStatus(ORDER_STATUS.SHIPPED),
  validate(orderStatusValidator.ship),
  orderStatusController.updateStatus)

/* Order Stock Received Model. */
/**
 * @typedef OrderStockReceived
 * @property {integer} id - OrderStock - eg:1
 * @property {integer} status - OrderStock Status - eg:1
 * @property {integer} fulfill_reason - OrderStock Fulfill Reason - eg:1
 * @property {string} other_reason - OrderStock Fulfill Other Reason - eg:Other Reason
 * @property {integer} received_qty - OrderStock received_qty - eg:10
 * @property {string} qrcode - OrderStock QRCode - eg:SML62123411
 */

/**
 * @typedef OrderItemReceived
 * @property {integer} id - OrderStock - eg:1
 * @property {integer} material_id - OrderStock Status - eg:1
 * @property {Array.<OrderStockReceived>} order_stocks - OrderStock - eg:10
 */
/* Order Fulfilled Model. */
/**
 * @typedef OrderFulfilled
 * @property {string} comment - Komentar - eg:Komentar
 * @property {string} fulfilled_at - Fulfilled At - eg:2020-12-31
 * @property {Array.<OrderItemReceived>} order_items - Order Item - eg:#SAF100
 */

/* PUT order fulfilled. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/fulfilled
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @param {OrderFulfilled.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/fulfilled',
  // notHasRole(['ADMIN']),
  fulfillLimiter,
  orderStatusController.setStatus(ORDER_STATUS.FULFILLED),
  validate(orderStatusValidator.fulfilled),
  orderStatusController.updateStatus)

/* OrderCancel Model. */
/**
 * @typedef OrderCancel
 * @property {integer} cancel_reason - Cancel Reason (1. Receiving Facility Request, 2. Double Entry, 3. Wrong Order, 4. Others) - eg:1
 * @property {string} other_reason - Other Reason - eg:alasan lainnya
 * @property {string} comment - Komentar - eg:Alasan atau Komentar
 */

/* PUT order cancel. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/cancel
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @param {OrderCancel.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/cancel',
  cancelLimiter,
  orderStatusController.setStatus(ORDER_STATUS.CANCELED),
  validate(orderStatusValidator.cancel),
  orderStatusController.updateStatus)

/* PUT order pending. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/pending
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @param {OrderStatus.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/pending',
  pendingLimiter,
  orderStatusController.setStatus(ORDER_STATUS.PENDING),
  validate(orderStatusValidator.pending),
  orderStatusController.updateStatus)

/* GET order status listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders/status
 * @group Order - Operations about order comments
 * @param {string} type.query - Type(1,2) (1 - Normal, 2 - Dropping)
 * @param {string} purpose.query - Purpose (purchase, sales)
 * @param {integer} vendorId.query - id vendor
 * @param {integer} customerId.query - id customer
 * @param {string} ordered_number.query - ordered number
 * @param {string} purchase_ref.query - purchase reference
 * @param {string} sales_ref.query - sales reference
 * @param {integer[]} tags.query - array string id tags
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @returns {object} 200 - [
 *   {
 *     "id": 1,
 *     "title": "string"
 *     "total": 10,
 *    }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET order history listing. */
/**
 * This function history is parsed by doctrine
 * @route GET /order/{id}/histories
 * @group Order - Operations about order histories
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouter.get('/:id/histories',
  parameterModel.custom('OrderHistory', orderController.orderHistory),
  commonController.unlimitedList)

/* GET order export excel. */
/**
 * This function history is parsed by doctrine
 * @route GET /order/{id}/export-excel
 * @group Order - Operations about order export
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouterIOT.get('/:id/export-excel',
  orderController.setWorkbookTwo('sbbk'),
  orderController.exportExcelTwo)

/* GET order export var. */
/**
 * This function history is parsed by doctrine
 * @route GET /order/{id}/export-var
 * @group Order - Operations about order export
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouterIOT.get('/:id/export-var',
  orderController.setWorkbookTwo('var'),
  orderController.exportExcelTwo)

  /* GET order export requirement. */
/**
 * This function history is parsed by doctrine
 * @route GET /order/{id}/export-requirement
 * @group Order - Operations about order export
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouterIOT.get('/:id/export-requirement',
  orderController.setWorkbookTwo('requirement'),
  orderController.exportExcelWithOrderV2)

  /* GET order export nota batch. */
/**
 * This function history is parsed by doctrine
 * @route GET /order/{id}/export-nota-batch
 * @group Order - Operations about order export
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouterIOT.get('/:id/export-nota-batch',
  orderController.setWorkbookTwo('nota-batch'),
  orderController.exportExcelWithOrderV2)

  /* GET order export nota confirmation. */
/**
 * This function history is parsed by doctrine
 * @route GET /order/{id}/export-nota-confirmation
 * @group Order - Operations about order export
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouterIOT.get('/:id/export-nota-confirmation',
  orderController.setWorkbookTwo('nota-confirmation'),
  orderController.exportExcelWithOrderV2)

/* GET order export excel. */
/**
 * This function history is parsed by doctrine
 * @route GET /order/{id}/export-excel
 * @group Order - Operations about order export
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouter.get('/v2/:id/export-excel',
  orderController.setWorkbookTwo('sbbk'),
  orderController.exportExcelTwo)

/* GET order export var. */
/**
* This function history is parsed by doctrine
* @route GET /order/{id}/export-var
* @group Order - Operations about order export
* @param {id} id.path - id order
* @returns {object} 200
* @returns {Error}  default - Unexpected error
* @security [{"JWT":[]}]
*/
orderRouter.get('/v2/:id/export-var',
  orderController.setWorkbookTwo('var'),
  orderController.exportExcelTwo)

orderRouter.get('/v3/:id/export-var',
  orderController.setWorkbookTwo('laporan penerimaan'),
  orderController.exportExcelTwo)

/* PUT order kpcpen. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /order/{id}/submitKPCPEN
 * @group Order - Operations about order
 * @param {id} id.path - id order
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouter.put('/:id/submitKPCPEN',
  orderStatusController.updateKPCPEN)

orderRouter.put(
  '/:id/updateNoDO',
  orderStatusController.updateNoDO,
)

/* OrderReport Model. */
/**
 * @typedef OrderReport
 * @property {integer} material_id - 1 - Customer id - eg:1
 * @property {string} arrived_date - estimasi tanggal - eg:2021-01-01
 * @property {integer} arrived_qty - rekomendasi stock - eg:100
 * @property {string} batch_code - Reason ID () - eg: AAABBB
 * @property {string} batch_expired - Other Reason - eg:2021-01-01
 * @property {string} batch_production - Production Date - eg:2021-01-01
 * @property {integer} order_id - Order ID - eg:1
 */

/* POST report order covid. */
/**
 * This function comment is parsed by doctrine
 * @group Order - Operations about order
 * @route POST /order/report/covid
 * @param {Array.<OrderReport>} data.body Create - OrderReport
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */
orderRouter.post(
  '/report/covid',
  hasRole(['MANAGER', 'MANAGER_COVID']),
  validate(orderValidator.report),
  orderReportController.sendReport,
)

/* GET report order covid. */
/**
 * This function comment is parsed by doctrine
 * @group Order - Operations about order
 * @route GET /order/reports/covid
 * @param {integer} id.query - id
 * @param {integer} entity_id.query - id entitas
 * @param {integer} material_id.query - id material
 * @param {string} message.query - message
 * @param {string} created_at.query - created_at
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @param {string} keyword.query - Keyword (Batch code)
 * @param {integer} province_id.query - Province ID
 * @param {integer} regency_id.query - Regency ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
orderRouter.get(
  '/reports/covid',
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('OrderReport', orderReportController.list),
  commonController.list,
)

/* GET xls report order covid. */
/**
 * This function comment is parsed by doctrine
 * @group Order - Operations about order
 * @route GET /order/reports/covid/xls
 * @param {integer} id.query - id
 * @param {integer} entity_id.query - id entitas
 * @param {integer} material_id.query - id material
 * @param {string} message.query - message
 * @param {string} created_at.query - created_at
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @param {string} keyword.query - Keyword (Batch code)
 * @param {integer} province_id.query - Province ID
 * @param {integer} regency_id.query - Regency ID
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
orderRouter.get(
  '/reports/covid/xls',
  hasRole(['SUPERADMIN']),
  parameterModel.custom('OrderReport', orderReportController.list),
  downloadData,
)

/* GET report order bpom. */
/**
 * This function comment is parsed by doctrine
 * @group Order - Operations about order
 * @route GET /order/reports/bpom
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
orderRouter.get(
  '/reports/bpom',
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('HttpLog', orderBPOMController.list),
  commonController.list,
)

orderRouter.post(
  '/sync-post-kpcpen',
  hasRole(['ADMIN', 'SUPERADMIN']),
  orderStatusController.syncPostKpcpen,
)

orderRouter.use('/event-report-reason', eventReportReasonRouter)
orderRouter.use('/event-report-child-reason', eventReportReasonChildRouter)
orderRouter.use('/event-report', eventReportRouter)

// orderRouter.use('/event-report', )
  
export {orderRouter, orderRouterIOT} 
