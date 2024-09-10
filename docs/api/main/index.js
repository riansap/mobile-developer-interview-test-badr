/* GET home page. */

/* GET entity-tags listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity-tags
 * @group Entity Tag - Operations about entity
 * @param {string} keyword.query - Title entitas Tag
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "title": "Dinas Kesehatan"}]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET order listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders/covid-distribution
 * @group Order - Operations about order
 * @param {integer} vendor_id.query - Vendor ID
 * @param {integer} customer_id.query - Customer ID
 * @param {string} order_id.query - order_id
 * @param {integer} status.query - status order
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @param {integer} paginate.query - paginate
 * @param {integer} page.query - page
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET order listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders/covid-receiption
 * @group Order - Operations about order
 * @param {integer} vendor_id.query - Vendor ID
 * @param {integer} customer_id.query - Customer ID
 * @param {integer} order_id.query - order_id
 * @param {integer} response_status.query - status receiption (200,400,404)
 * @param {string} from_date.query - from date (Y-m-d)
 * @param {string} to_date.query - to date (Y-m-d)
 * @param {integer} material_id.query - material_id
 * @param {integer} paginate.query - paginate
 * @param {integer} page.query - page
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET order listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders/xls
 * @group Order - Operations about order
 * @param {integer} entityId.query - id entitas
 * @param {integer} vendorId.query - id vendor
 * @param {integer} customerId.query - id cutomer
 * @param {string} ordered_number.query - ordered number
 * @param {string} purchase_ref.query - purchase reference
 * @param {string} sales_ref.query - sales reference
 * @param {integer[]} tags.query - array string id tags
 * @param {integer} type.query - type order {NORMAL 1, DROPPING 2}
 * @param {string} purpose.query - [purchase, sales] string
 * @param {integer} status.query - status order
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET provinces listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /provinces
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET regencies listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /regencies
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {string} province_id.query - province ID - province ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET subdistricts listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /subdistricts
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {string} regency_id.query - regency ID - regency ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET villages listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /villages
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {string} sub_district_id.query - subdistrict ID - subdistrict ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET timezones listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /timezones
 * @group Region - Operations about region
 * @param {string} keyword.query - Title - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET order stock listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /order-stocks
 * @group Order Stocks - Operations about order stocks
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {integer} customer_id.query - customer id - 1
 * @param {integer} vendor_id.query - vendor id - 1
 * @param {string} from.query - from - ex: YYYY-MM-DD
 * @param {string} to.query - to - ex: YYYY-MM-DD
 * @param {integer} material_tag_id.query - material_tag_id - 6 (covid)
 * @param {integer} material_id.query - material id
 * @param {integer} transaction_type_id.query - transaction type id
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/**
 * This function comment is parsed by doctrine
 * @route GET /track-devices
 * @group TrackDevice - Operations about TrackDevice
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {integer} province_id.query - Province ID
 * @param {integer} regency_id.query - Regency ID
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/**
 * This function comment is parsed by doctrine
 * @route GET /track-devices/last
 * @group TrackDevice - Operations about TrackDevice
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/**
 * This function comment is parsed by doctrine
 * @route POST /job/recap-entity-notification
 * @group Notification - Operations about TrackDevice
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/**
 * This function comment is parsed by doctrine
 * @route POST /job/check-stock-material
 * @group Notification - Operations about TrackDevice
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
