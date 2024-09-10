/* TransactionType Model. */
/**
 * @typedef TransactionType
 * @property {string} title.required - Test - Nama transaction type
 *
 */

/* GET transaction-types listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /transaction-types
 * @group TransactionType - Operations about transaction type
 * @param {string} keyword.query - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST transaction-type creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /transaction-type
 * @group TransactionType - Operations about transaction-type
 * @param {TransactionType.model} data.body Create - Entitas
 * @returns {object} 201 - {
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET transaction-type detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /transaction-type/{id}
 * @group TransactionType - Operations about transaction-type
 * @param {id} id.path - id transaction-type
 * @returns {object} 200 - {
 * "id": 1,
 * "title": "Judul Trans Type"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT transaction-type updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /transaction-type/{id}
 * @group TransactionType - Operations about transaction-type
 * @param {id} id.path - id transaction-type
 * @param {TransactionType.model} data.body Update - transaction-type
 * @returns {object} 200 - {
 * "id": 1,
 * "title": "Judul Trans Type"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* DELETE transaction-type deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /transaction-type/{id}
 * @group TransactionType - Operations about transaction-type
 * @param {id} id.path - id transaction-type
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET transaction-type reason. */
/**
 * This function comment is parsed by doctrine
 * @route GET /transaction-type/{id}/transaction_reasons
 * @group TransactionType - Operations about transaction-type
 * @param {id} id.path - id transaction-type
 * @returns {object} 200 - {
 * "id": 1,
 * "title": "Judul Trans Type"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
