/* GET users listing. */
/**
 * @typedef User
 * @property {string} username.required - Username user - eg:username
 * @property {string} email.required - Email user - eg:test@example.com
 * @property {string} password.required - Password user - eg:password123
 * @property {string} firstname - First Name user  - eg:First Name
 * @property {string} lastname - Last Name user - eg:Last Name
 * @property {integer} gender - Gender user - eg:1
 * @property {string} date_of_birth - Date Of Birth user - eg:1990-01-01
 * @property {string} mobile_phone - Phone user - eg:08129090090
 * @property {string} address - Address user - eg:JL. Raya Margonda, No.1
 * @property {integer} role.required - Role user - eg:4
 * @property {integer} village_id - Village ID user - eg:0
 * @property {integer} entity_id.required - Entity ID user - eg:0
 * @property {integer} timezone_id - Timezone ID user - eg:0
 * @property {integer} status - Status User (0 disable, 1 active) - eg:1
 * @property {integer} view_only - View Only User (0 disable, 1 active) - eg:1
 */

/* GET users listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /users
 * @group User - Operations about user
 * @param {string} keyword.query - Nama/No HP/username - Keyword
 * @param {integer} role.query - Role - Role
 * @param {string} start_date.query - Start Date Last Login
 * @param {string} end_date.query - End Date Last Login
 * @param {integer} status.query - Status(0 inactive, 1 Active)
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST user creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /user
 * @group User - Operations about user
 * @param {User.model} data.body Create - User
 * @returns {object} 201 - {
 * "title": "Dinas Kesehatan",
 * "transaction_type_id": ""
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST user faskes creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /user/faskes-generate
 * @group User - Operations about user
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 * "message": "success",
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT user updating. */
/**
 * This function comment is parsed by doctrine
 * @route GET /user/{id}
 * @group User - Operations about user
 * @param {id} id.path - id user
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

/* PUT user updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /user/{id}
 * @group User - Operations about user
 * @param {id} id.path - id user
 * @param {User.model} data.body Update - user
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

/* DELETE user deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /user/{id}
 * @group User - Operations about user
 * @param {id} id.path - id user
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/**
 * @typedef UpdateStatus
 * @property {integer} status - Status (0 disable, 1 active) - eg:1
 */

/* PUT user update status. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /user/{id}/status
 * @group User - Operations about user
 * @param {id} id.path - id user
 * @param {UpdateStatus.model} data.body - Update - user
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* POST users xls. */
/**
 * This function comment is parsed by doctrine
 * @route POST /users/xls
 * @group User - Operations about user
 * @param {file} file.formData.required - File XLS - user
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* GET template xls. */
/**
 * Get XLS Template User
 * @route GET /xls/template/user
 * @group User - Operations about User
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* GET data xls. */
/**
 * Get XLS Data User
 * @route GET /users/xls
 * @group User - Operations about User
 * @param {string} keyword.query - Nama/No HP/username - Keyword
 * @param {integer} role.query - Role - Role
 * @param {string} start_date.query - Start Date Last Login
 * @param {string} end_date.query - End Date Last Login
 * @param {integer} status.query - Status(0 inactive, 1 Active)
 * @returns {object} 200 - {
 * "message": "Success mengambil data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/
