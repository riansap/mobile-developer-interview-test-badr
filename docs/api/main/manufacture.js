/* Manufacture Model. */
/**
 * @typedef Manufacture
 * @property {string} reference_id.required - 1 - referensi - eg:ref_0001
 * @property {string} name.required - 1 - name manufakture - eg:Biofarma
 * @property {string} description - 1 - deskripsi manufakture - eg:Biofarma Manufacture
 * @property {string} contact_name.required - 2 - Nama kontak - eg:SMILE
 * @property {string} email - 2 - Email kontak - eg:info@smile-indonesia.id
 * @property {string} phone_number - 300 - Nomor telepon manufaktur - eg:081245678910
 * @property {string} address - 200 - Alamat manufaktur - eg: Depok
 * @property {number} village_id - 200 - Id desa - eg: 1
 * @property {integer} is_asset - 1 - Is Asset - eg: 1
 * @property {integer} status - Status (0 disable, 1 active) - eg: 1
 * @property {integer} type - Type Manufacture(1: vaksin, 2: asset, 3: Logger) - eg: 1
 *
 */

/* GET manufactures listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /manufactures
 * @group Manufacture - Operations about material entity
 * @param {string} keyword.query - Manufacture name
 * @param {integer} material_id.query - id material
 * @param {integer} is_asset.query - Is Asset
 * @param {integer} type.query - Type Manufacture(1: vaksin, 2: asset, 3: Logger) - 1
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{
 *     "id": 1,
 *     "reference_id": "oke",
 *     "description": "Deskripsi manufaktur",
 *     "contact_name": "susilo",
 *     "phone_number": "0129",
 *     "email": "email@email.com",
 *     "address": "alamat",
 *     "village_id": 1,
 *     "village": {
 *       "id": 1,
 *       "name": "Desa",
 *       "sub_district_id": 1
 *     },
 *     "user_created_by": {
 *       "id": 1,
 *       "username": "dinkes",
 *       "firstname": "dinas",
 *       "lastname": "kesehatan"
 *     },
 *     "user_updated_by": {
 *        "id": 1,
 *       "username": "dinkes",
 *       "firstname": "dinas",
 *       "lastname": "kesehatan"
 *     },
 *     "user_deleted_by": {}
 *   }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* POST Manufacture creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /manufacture
 * @group Manufacture - Operations about Manufacture
 * @param {Manufacture.model} data.body Create - Entitas
 * @returns {object} 201 - {
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET manufacture detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /manufacture/{id}
 * @group Manufacture - Operations about Manufacture
 * @param {id} id.path - id manufacture
 * @returns {Manufacture.model} 200 
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT Manufacture updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /manufacture/{id}
 * @group Manufacture - Operations about Manufacture
 * @param {id} id.path - id Manufacture
 * @param {Manufacture.model} data.body Update - Entitas
 * @returns {Manufacture.model} 200 
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* DELETE Manufacture deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /manufacture/{id}
 * @group Manufacture - Operations about Manufacture
 * @param {id} id.path - id Manufacture
 * @returns {object} 200
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT manufacture update status. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /manufacture/{id}/status
 * @group Manufacture - Operations about manufacture
 * @param {id} id.path - id manufacture
 * @param {UpdateStatus.model} data.body - Update - manufacture
 * @returns {object} 200 - {
 * "message": "Success mengupdate data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/
