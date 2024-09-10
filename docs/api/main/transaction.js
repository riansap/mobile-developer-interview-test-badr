/* GET transactions listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /transactions
 * @group Transaction - Operations about transactions
 * @param {string} keyword.query - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {integer} material_id.query - material_id - 1
 * @param {integer} transaction_type_id.query - transaction_type_id - 1
 * @param {integer} vendor_id.query - vendor_id - 1
 * @param {integer} customer_id.query - customer_id - 1
 * @param {integer} material_tag_id.query - material_tag_id - 1
 * @param {integer} transaction_reason_id.query - transaction_reason_id - 1
 * @param {string} start_date.query - start_date - ex:2020-10-15
 * @param {string} end_date.query - end_date - ex:2020-10-31
 * @param {integer} entity_id.query - Entity ID - 1
 * @param {integer} is_consumption.query - is_consumption
 * @param {integer} is_distribution.query - is_distribution
 * @param {integer} is_order.query - is_order(0/1)
 * @param {integer} order_type.query - order type (1: Rutin, 2: Alokasi Covid, 3: Pengembalian)
 * @param {integer} entity_tag_id.query - Entity Tag ID 
 * @param {integer} customer_tag_id.query - Customer Entity Tag ID 
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/**
 * @typedef StockTransaction
 * @property {integer} transaction_type_id.required - Transaction Type ID - eg:1
 * @property {integer} transaction_reason_id.required - Transaction Reason ID - eg:1
 * @property {integer} status_id - Status ID - eg:1
 * @property {integer} material_id.required - Material ID - eg:1
 * @property {integer} stock_id - Stock ID - eg:1
 * @property {integer} customer_id - Customer ID
 * @property {integer} vendor_id - Vendor ID
 * @property {integer} change_qty.required - Change Quantity - eg:10
 * @property {integer} broken_qty - Broken Quantity (for Type Return) - eg:0
 * @property {string} created_at.required - Created Date - eg:2020-10-01 23:50:01
 * @property {boolean} is_batches.required - Is Batches - eg:true
 * @property {StockBatch.model} batch - BatchObject
 */

/**
 * @typedef StockBatch
 * @property {string} code.required - Batch Code - eg:AABB
 * @property {string} expired_date.required - Expired Date - eg:2020-12-30
 * @property {string} production_date - Production Date - eg:2020-10-17
 * @property {integer} manufacture_id.required - Manufacture ID - eg:1
 */

/* POST transaction submit. */
/**
 * This function comment is parsed by doctrine
 * @route POST /transactions
 * @group Transaction - Operations about stock
 * @param {Array.<StockTransaction>} data.body Create - Stock
 * @returns {object} 200 - {}
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */

/* GET transaction entity export excel. */
/**
 * This function history is parsed by doctrine
 * @route GET /transaction/{entity_id}/export-excel
 * @group Transaction - Operations about transaction entity export
 * @param {integer} entity_id.path - id entity
 * @param {integer} month.query - month 1 - 12
 * @param {integer} year.query - year 
 * @returns {object} 200 
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET transaction all entity export excel. */
/**
 * This function history is parsed by doctrine
 * @route GET /transactions/all-entity/xls
 * @group Transaction - Operations about transaction all entity export
 * @param {integer} month.query - month 1 - 12
 * @param {integer} year.query - year 
 * @param {integer} entity_id.query - Entity ID 
 * @returns {object} 200 
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET transactions export excel. */
/**
 * This function history is parsed by doctrine
 * @route GET /transactions/xls
 * @group Transaction - Operations about transaction export
 * @param {string} keyword.query - Keyword
 * @param {integer} material_id.query - material_id - 1
 * @param {integer} transaction_type_id.query - transaction_type_id - 1
 * @param {integer} vendor_id.query - vendor_id - 1
 * @param {integer} customer_id.query - customer_id - 1
 * @param {integer} material_tag_id.query - material_tag_id - 1
 * @param {integer} transaction_reason_id.query - transaction_reason_id - 1
 * @param {string} start_date.query - start_date - ex:2020-10-15
 * @param {string} end_date.query - end_date - ex:2020-10-31
 * @param {integer} entity_id.query - Entity ID - 1
 * @param {integer} is_consumption.query - is_consumption
 * @param {integer} is_distribution.query - is_distribution
 * @param {integer} is_order.query - is_order(0/1)
 * @returns {object} 200 
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
