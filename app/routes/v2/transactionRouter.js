import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import * as commonController from '../../controllers/commonController'
import * as transactionXLSController from '../../controllers/v2/transaction/transactionXLSController'

const transactionRouter = express.Router()

/**
 * GET transactions listing
 * @route GET /v2/transactions
 * @group Transaction v2 - Operations about transactions
 * @param {string} keyword.query - name master activity - eg:RANDOM
 * @param {integer} activity_id.query - activity ID - eg:1
 * @param {integer} is_vaccine.query - Is Vaccine - eg:1
 * @param {integer} transaction_type_id.query - transaction_type_id - eg:1
 * @param {integer} transaction_reason_id.query - transaction_reason_id - eg:1
 * @param {integer} start_date.query - start_date - eg:1
 * @param {integer} end_date.query - end_date - eg:1
 * @param {integer} is_order.query - is_order - eg:1
 * @param {integer} is_consumption.query - is_consumption - eg:1
 * @param {integer} is_distribution.query - is_distribution - eg:1
 * @param {integer} entity_tag_id.query - entity_tag_id - eg:1
 * @param {integer} vendor_id.query - vendor_id - eg:1
 * @param {integer} entity_id.query - entity_id - eg:1
 * @param {integer} province_id.query - province_id - eg:1
 * @param {integer} regency_id.query - regency_id - eg:1
 * @param {integer} sub_district_id.query - sub_district_id - eg:1
 * @param {integer} customer_tag_id.query - customer_tag_id - eg:1
 * @param {integer} vendor_id.query - vendor_id - eg:1
 * @param {integer} customer_id.query - customer_id - eg:1
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 * "total": 0,
 * "page": 1,
 * "perPage": 10,
 * "list": [{
 *   "id": 1,
 *   "name": "Routine"
 *  }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET transaction entity export excel. */
/**
 * This function history is parsed by doctrine
 * @route GET /v2/transaction/{entity_id}/export-excel
 * @group Transaction - Operations about transaction entity export
 * @param {integer} entity_id.path - id entity
 * @param {integer} month.query - month 1 - 12
 * @param {integer} year.query - year 
 * @returns {object} 200 
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
transactionRouter.get('/:entity_id/export-excel',
  transactionXLSController.exportBukuStokByEntity
)

/**
 * GET transactions detail
 * @route GET /v2/transactions/{id}
 * @group Transaction v2 - Operations about transactions
 * @param {id} id.path - id master activity
 * @returns {object} 201 - {}
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */
transactionRouter.get(
  '/:id',
  parameterModel.define('Transaction'),
  commonController.detail
)

/* POST transaction submit. */
/**
 * This function comment is parsed by doctrine
 * @route POST /v2/transactions
 * @group Transaction v2 - Operations about transactions
 * @param {Array.<StockTransaction2>} data.body Create - Stock
 * @returns {object} 200 - {}
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": [], "timezone":[]}]
 */

/**
 * @typedef StockTransaction2
 * @property {integer} transaction_type_id.required - Transaction Type ID - eg:1
 * @property {integer} transaction_reason_id.required - Transaction Reason ID - eg:1
 * @property {integer} status_id - Status ID - eg:1
 * @property {integer} material_id.required - Material ID - eg:1
 * @property {integer} activity_id.required - Activity ID - eg:1
 * @property {integer} stock_id - Stock ID - eg:1
 * @property {integer} customer_id - Customer ID
 * @property {integer} vendor_id - Vendor ID
 * @property {integer} change_qty.required - Change Quantity - eg:10
 * @property {integer} broken_qty - Broken Quantity (for Type Return) - eg:0
 * @property {string} saved_at.required - Saved Date - eg:2020-10-01 23:50:01
 * @property {boolean} is_batches.required - Is Batches - eg:true
 * @property {integer} entity_id - Entity ID - eg: 1
 * @property {StockBatch.model} batch - BatchObject
 * @property {integer} dose_1 - Dose 1 - eg:10
 * @property {integer} dose_2 - Dose 2 - eg:10
 * @property {integer} booster - Booster - eg:10
 * @property {integer} open_vial - Open Vial Qty - eg:0
 * @property {integer} close_vial - Close Vial Qty - eg:0
 * @property {integer} broken_open_vial - Broken Open Vial - eg:0
 * @property {integer} broken_close_vial - Broken Close Vial - eg:0
 */

/**
 * GET transactions detail
 * @route GET /v2/transactions/{id}
 * @group Transaction v2 - Operations about transactions
 * @param {id} id.path - id master activity
 * @returns {object} 201 - {}
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */

export default transactionRouter
