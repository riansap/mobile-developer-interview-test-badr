/* GET stocks listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /stocks
 * @group Stock - Operations about transaction type
 * @param {string} keyword.query - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {string} expired_before.query - Expired Before - 2020-10-15
 * @param {string} material_tag_id.query - Material Tag - 1
 * @param {string} material_id.query - Material ID - 1
 * @param {string} entity_id.query - Entity ID - 1
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */

/**
 * This function comment is parsed by doctrine
 * @route GET /stocks/xls
 * @group Stock - Operations about transaction type
 * @param {string} keyword.query - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {string} expired_before.query - Expired Before - 2020-10-15
 * @param {string} material_tag_id.query - Material Tag - 1
 * @param {string} material_id.query - Material ID - 1
 * @param {string} entity_id.query - Entity ID - 1
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */

/* GET stock material listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /stock/material
 * @group Stock - Operations about stock material
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @returns {object} 200 - [
 * {
 *   "on_hand": 0,
 *   "allocated": 0,
 *   "id": 1,
 *   "material_entity_id": 1,
 *   "batch_id": 1,
 *   "status": 1,
 *   "qty": 100,
 *   "created_by": 1,
 *   "updated_by": 1,
 *   "createdAt": "2020",
 *   "updatedAt": "2020",
 *   "batch": {
 *     "manufacture_name": "Serum Institute Of India",
 *     "id": 1,
 *     "code": "BCG1",
 *     "expired_date": "1990",
 *     "production_date": "2020",
 *     "manufacture_id": 1,
 *     "manufacture": {
 *       "name": "Serum Institute Of India",
 *       "address": "Pasirtanjung, Jawa Barat, ID"
 *     }
 *  }
 * }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

// stock issue
/* GET transactions stock summary listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /stock/issue
 * @group Stock - Operations about transactions
 * @param {integer} material_id.query - material_id - 1
 * @param {integer} entity_id.query - entity_id - 1
 * @param {integer} customer_id.query - customer_id - 1
 * @param {integer} material_tag_id.query - material tag id - 1
 * @returns {object} 200 - {
 *    [{ "id": 1, "name": "Material", "stock": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
