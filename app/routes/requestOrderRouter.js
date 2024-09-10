import express from 'express'
import * as requestOrderController from '../controllers/requestOrderController'

import { validate } from '../validators'
import * as requestOrderValidator from '../validators/requestOrderValidator'

const requestOrderRouter = express.Router()

/* GET request_orders listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /request-orders
 * @group RequestOrder - Operations about transaction type
 * @param {string} sales_ref.query - sales ref - #SAA
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": []
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */

/**
 * @typedef RequestOrder
 * @property {string} customer_code.required - Customer Code - eg:31
 * @property {string} sales_ref - Sales Ref - eg:#SREF 
 * @property {integer} buffer_tag.required - Buffer Tag (1,2,3) - eg:1
 * @property {Array.<RequestOrderItem>} order_items - RequestOrderItem
 */

/**
 * @typedef RequestOrderItem
 * @property {string} material_code.required - Material Code - eg:SINOVAC
 * @property {integer} qty.required - Qty - eg:10
 */

/* POST request_order. */
/**
 * This function comment is parsed by doctrine
 * @route POST /request-order
 * @group RequestOrder - Operations about stock material
 * @param {RequestOrder.model} data.body - id material
 * @returns {object} 200 - [
 * {
 * }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
requestOrderRouter.post('/',
  validate(requestOrderValidator.create),
  requestOrderController.create,
)

export default requestOrderRouter