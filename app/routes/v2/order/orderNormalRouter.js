import express from 'express'
import rateLimit from 'express-rate-limit'

import parameterModel from '../../../helpers/parameterModel'
import * as commonController from '../../../controllers/commonController'
import * as orderNormalController from '../../../controllers/v2/order/orderNormalController'
import * as orderDroppingController from '../../../controllers/v2/order/orderDroppingController'
import * as orderListController from '../../../controllers/v2/order/orderListController'
import * as orderStatusControllerV2 from '../../../controllers/v2/order/orderStatusController'
import * as orderStatusControllerV1 from '../../../controllers/orderStatusController'

import { validate } from '../../../validators'
import * as orderValidator from '../../../validators/v2/order/orderValidator'
import * as orderStatusValidatorV2 from '../../../validators/v2/order/orderStatusValidator'
import * as orderAllocateValidator from '../../../validators/v2/order/orderAllocateValidator'
import * as orderDroppingValidator from '../../../validators/v2/order/orderDroppingValidator'
import * as orderShipValidator from '../../../validators/v2/order/orderShipValidator'
import * as orderFulfillValidator from '../../../validators/v2/order/orderFulfillValidator'

import { hasRole, notHasRole } from '../../../middlewares/authMiddleware'
import { ORDER_STATUS, ORDER_TYPE, USER_ROLE } from '../../../helpers/constants'

import { limitterOptions } from '../../../helpers/services/rateLimiterHelper'
import { validateFreezeTransactions } from '../../../middlewares/maintenanceMiddleware'

const orderRouter = express.Router()

/* Order Model. */
/**
 * @typedef OrderV2
 * @property {number} customer_id.required - 1 - Customer id - eg:1
 * @property {number} vendor_id.required - 1 - Vendor id - eg:1
 * @property {number} status.required - 2 - Status pesanan [pending: 1, confirmed: 2, shipped: 3, fulfilled: 4, cancelled: 5] - eg:1
 * @property {number} type.required - 1 - tipe pesanan [normal: 1, dropping: 2] - eg:1
 * @property {string} required_date.required - Tanggal dibutuhkan - eg:2020-12-31
 * @property {string} estimated_date - estimasi tanggal - eg:2020-12-31
 * @property {string} purchase_ref - referensi pembelian - eg:#PURCHASEREF
 * @property {string} sales_ref - referensi penjualan - eg:#SREF
 * @property {integer} reason - [1: kekurangan pasokan, 2: pertambahan penduduk, 3: wabah] - eg:1
 * @property {number} activity_id - Activity ID - eg:1
 * @property {Array.<OrderItem>} order_items - array object [{material_id: 1, ordered_qty: 100}]
 * @property {OrderComment.model} order_comment - array object [{comment: '123'}]
 */

/**
 * This function comment is parsed by doctrine
 * @route GET /v2/orders
 * @group Order V2 - Operations about order
 * @param {integer} entityId.query - id entitas
 * @param {string} vendorId.query - id vendor
 * @param {integer} customerId.query - id cutomer
 * @param {string} ordered_number.query - ordered number
 * @param {string} purchase_ref.query - purchase reference
 * @param {string} sales_ref.query - sales reference
 * @param {integer} activity_id.query - activity_id
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

/**
 * POST order creating v2
 * @route POST /v2/order
 * @group Order V2 - Operations about order
 * @param {OrderV2.model} data.body Create - Order
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */

orderRouter.post('/',
  notHasRole(['ADMIN']),
  validateFreezeTransactions,
  validate(orderValidator.create),
  orderNormalController.create)

/* PUT order updating. */
/**
 * PUT order updating v2
 * @route PUT /v2/order/{id}
 * @param {id} id.path - id order
 * @group Order V2 - Operations about update order
 * @param {OrderUpdate.model} data.body Create - Order
 * @returns {object} 200 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */
orderRouter.put('/:id',
  notHasRole(['ADMIN']),
  validateFreezeTransactions,
  rateLimit(limitterOptions),
  validate(orderValidator.update),
  orderNormalController.update)

/**
 * GET order detail v2
 * @route GET /v2/order/{id}
 * @group Order V2 - Operations about order
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
  orderNormalController.detail
)

// orderRouter.get('/:id/order-items',
//   parameterModel.custom('OrderItem', orderNormalController.orderItem),
//   commonController.unlimitedList)

/**
 * Insert Order Items
 * @route PUT /v2/order/{id}/order-items
 * @group Order V2 - Operations about insert order items
 * @param {id} id.path - id order
 * @param {InsertOrderItem.model} data.body insert - order item
 * @returns {object} 200 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[], "timezone":[]}]
 */

orderRouter.put('/:id/order-items',
  validate(orderValidator.insertOrderItem),
  orderNormalController.insertOrderItem)

orderRouter.put('/:id/order-items-kfa',
  validate(orderValidator.insertOrderItemKfa),
  orderNormalController.insertOrderItemKfa)

/**
 * PUT order allocate
 * @route PUT /v2/order/{id}/allocate
 * @group Order V2 - Operations about order
 * @param {id} id.path - id order
 * @param {Array.<OrderAllocated>} data.body
 * @returns {OrderV2.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/allocate',
  validateFreezeTransactions,
  rateLimit(limitterOptions),
  validate(orderAllocateValidator.allocate),
  orderStatusControllerV1.allocateStock)

/* GET order comment listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /v2/order/{id}/comments
 * @group Order V2 - Operations about order comments
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

/* PUT order confirm. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /v2/order/{id}/confirm
 * @group Order V2 - Operations about order
 * @param {id} id.path - id order
 * @param {OrderConfirm.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/confirm',
  validateFreezeTransactions,
  rateLimit(limitterOptions),
  orderStatusControllerV2.setStatus(ORDER_STATUS.CONFIRMED),
  validate(orderStatusValidatorV2.confirm),
  orderStatusControllerV2.updateStatus)

/**
 * PUT order ship.
 * @route PUT /v2/order/{id}/ship
 * @group Order V2 - Operations about order
 * @param {id} id.path - id order
 * @param {OrderShipment.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/ship',
  validateFreezeTransactions,
  rateLimit(limitterOptions),
  orderStatusControllerV2.setStatus(ORDER_STATUS.SHIPPED),
  validate(orderShipValidator.ship),
  orderStatusControllerV2.updateStatus)


/* Order Fulfilled Model. */
/**
 * @typedef OrderFulfilledV2
 * @property {string} comment - Komentar - eg:Komentar
 * @property {string} fulfilled_at - Fulfilled At - eg:2020-12-31
 * @property {Array.<OrderItemReceivedV2>} order_items - Order Item - eg:#SAF100
 */

/**
 * @typedef OrderItemReceivedV2
 * @property {integer} id - OrderStock - eg:1
 * @property {integer} material_id - OrderStock Status - eg:1
 * @property {Array.<OrderStockReceivedV2>} order_stock_fulfill - OrderStock - eg:10
 */

/**
 * @typedef OrderStockReceivedV2
 * @property {Array.<integer>} order_stock_ids - Order Stock ID - eg:[array of id]
 * @property {integer} batch_id - Batch ID - eg:100
 * @property {integer} status - OrderStock Status - eg:1
 * @property {integer} fulfill_reason - OrderStock Fulfill Reason - eg:1
 * @property {string} other_reason - OrderStock Fulfill Other Reason - eg:Other Reason
 * @property {integer} received_qty - OrderStock received_qty - eg:10
 * @property {string} qrcode - OrderStock QRCode - eg:SML62123411
 */

/**
 * PUT order fulfilled
 * @route PUT /v2/order/{id}/fulfilled
 * @group Order V2 - Operations about order
 * @param {id} id.path - id order
 * @param {OrderFulfilledV2.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/fulfilled',
  validateFreezeTransactions,
  rateLimit(limitterOptions),
  orderStatusControllerV2.setStatus(ORDER_STATUS.FULFILLED),
  validate(orderFulfillValidator.fulfilled),
  orderStatusControllerV2.updateStatus)

/**
 * PUT order cancel.
 * @route PUT /v2/order/{id}/cancel
 * @group Order V2 - Operations about order
 * @param {id} id.path - id order
 * @param {OrderCancel.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/cancel',
  validateFreezeTransactions,
  rateLimit(limitterOptions),
  orderStatusControllerV2.setStatus(ORDER_STATUS.CANCELED),
  validate(orderStatusValidatorV2.cancel),
  orderStatusControllerV2.updateStatus)

/**
 * PUT order pending.
 * @route PUT /v2/order/{id}/pending
 * @group Order V2 - Operations about order
 * @param {id} id.path - id order
 * @param {OrderStatus.model} data.body
 * @returns {Order.model} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[], "timezone":[]}]
 */
orderRouter.put('/:id/pending',
  validateFreezeTransactions,
  rateLimit(limitterOptions),
  orderStatusControllerV2.setStatus(ORDER_STATUS.PENDING),
  validate(orderStatusValidatorV2.pending),
  orderStatusControllerV2.updateStatus)

/**
 * GET order status listing.
 * @route GET /v2/orders/status
 * @group Order V2 - Operations about order comments
 * @param {string} type.query - Type(1,2) (1 - Normal, 2 - Dropping)
 * @param {string} purpose.query - Purpose (purchase, sales)
 * @param {integer} vendorId.query - id vendor
 * @param {integer} customerId.query - id customer
 * @param {string} ordered_number.query - ordered number
 * @param {string} purchase_ref.query - purchase reference
 * @param {string} sales_ref.query - sales reference
 * @param {integer[]} activity_id.query - array string id activity_id
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

/**
 * GET order history listing.
 * @route GET /v2/order/{id}/histories
 * @group Order V2 - Operations about order histories
 * @param {id} id.path - id order
 * @returns {object} 200
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
orderRouter.get('/:id/histories',
  parameterModel.custom('OrderHistory', orderListController.listOrderHistory),
  commonController.unlimitedList)

/* POST order covid creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /v2/order/dropping
 * @group Order V2 - Operations about order covid
 * @param {OrderCovidV2.model} data.body Create - OrderCovid
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */
orderRouter.post(
  '/dropping',
  (req, res, next) => {
    if (req.user.role === USER_ROLE.PKC) req.body.is_allocated = 0
    next()
  },
  validateFreezeTransactions,
  validate(orderDroppingValidator.create),
  orderDroppingController.create,
)

/* OrderCovidV2 Model. */
/**
 * @typedef OrderCovidV2
 * @property {string} customer_code.required - customer code - eg:DNKSJBR
 * @property {string} estimated_date - estimasi tanggal - eg:2020-12-31
 * @property {string} sales_ref - referensi penjualan - eg:#SREF
 * @property {string} delivery_number - nomor pengiriman - eg:#123-REGJKT
 * @property {integer} is_allocated - is_allocated - eg:1
 * @property {integer} type - Type (2. Dropping, 3. Pengembalian) - eg: 2
 * @property {integer} activity_id - Activity ID - eg:1
 * @property {OrderComment.model} order_comment - Order Comment
 * @property {Array.<OrderItemCovidV2>} order_items - array object [{material_id: 1, ordered_qty: 100}]
 */

/* OrderItemCovidV2 Model. */
/**
 * @typedef OrderItemCovidV2
 * @property {string} material_code - SINOVAC - Customer id - eg:SINOVAC
 * @property {Array.<BatchItemCovidV2>} batches - array object
 * @property {Array.<StockItemCovidV2>} stocks - array object
 */

/* BatchItemCovidV2 Model. */
/**
 * @typedef BatchItemCovidV2
 * @property {string} code - BATCHCODE123 - batch cod - eg:BATCHCODE123
 * @property {string} expired_date - tanggal kadaluarsa - eg:2020-12-31
 * @property {string} production_date - tanggal produksi - eg:2020-12-31
 * @property {string} manufacture_name - nama manufaktur - eg:Biofarma
 * @property {integer} qty - 100 - eg:100
 * @property {integer} activity_id - Activity ID - eg:1
 */

/* StockItemCovidV2 Model. */
/**
 * @typedef StockItemCovidV2
 * @property {integer} id - 1 - eg:1
 * @property {integer} qty - 100 - eg:100
 * @property {integer} activity_id - Activity ID - eg:1
 */
export default orderRouter
