/* TransactionReason Model. */
/**
 * @typedef TransactionReason
 * @property {string} title.required - Nama transaction type - eg:Example
 * @property {integer} transaction_type_id.required - ID Trans Type - eg:1
 *
 */

/* GET transaction-reasons listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /transaction-reasons
 * @group TransactionReason - Operations about transaction reason
 * @param {string} keyword.query - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "title": "Dinas Kesehatan", "transaction_type_id": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST transaction-reason creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /transaction-reason
 * @group TransactionReason - Operations about transaction-reason
 * @param {TransactionReason.model} data.body Create - Entitas
 * @returns {object} 201 - {
 * "title": "Dinas Kesehatan",
 * "transaction_type_id": ""
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT transaction-reason updating. */
/**
 * This function comment is parsed by doctrine
 * @route GET /transaction-reason/{id}
 * @group TransactionReason - Operations about transaction-reason
 * @param {id} id.path - id transaction-reason
 * @returns {object} 200 - {
 * "id": 1,
 * "title": "Judul Trans Type",
 * "transaction_type_id": ""
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT transaction-reason updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /transaction-reason/{id}
 * @group TransactionReason - Operations about transaction-reason
 * @param {id} id.path - id transaction-reason
 * @param {TransactionReason.model} data.body Update - transaction-reason
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

/* DELETE transaction-reason deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /transaction-reason/{id}
 * @group TransactionReason - Operations about transaction-reason
 * @param {id} id.path - id transaction-reason
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
