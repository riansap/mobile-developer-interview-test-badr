/* Entity Model. */
/**
 * @typedef Entity
 * @property {string} name.required - Nama entitas - eg:Dinas Kesahatan
 * @property {string} address.required - Alamat entitas - eg:Jakarta timur
 * @property {integer} type.required - Type - eg:1
 * @property {integer} status - Status (0 disable, 1 active) - eg: 1
 * @property {integer} province_id - Province ID - eg:1
 * @property {integer} regency_id - Regency ID - eg:1
 * @property {integer} village_id - Village ID - eg:1
 * @property {integer} sub_district_id - Subdistrict ID - eg:1
 * @property {double} lat - Latitude - eg:-6.574722
 * @property {double} lng - Longitude - eg:106.801293
 * @property {integer} postal_code - Postal Code - eg:16161
 * @property {string} country - Country - eg:Indonesia
 * @property {string} code - Code - eg:ENTITYCODE
 * @property {Array.<integer>} entity_tags - Entity Tag - eg:[1]
 *
 */

/* GET entities listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entities
 * @group Entity - Operations about entity
 * @param {string} keyword.query - Nama entitas / alamat
 * @param {integer} entity_tag.query - Entity Tag ID
 * @param {integer} is_vendor.query - Is Vendor (0,1)
 * @param {integer} type.query - Entity Type (1. Provinsi, 2. Kota, 3. Faskes)
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

/* POST entity creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity
 * @group Entity - Operations about entity
 * @param {Entity.model} data.body Create - Entitas
 * @returns {object} 201 - {
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET entity updating. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT entity updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /entity/{id}
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {Entity.model} data.body Update - Entitas
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* DELETE entity deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /entity/{id}
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET entities xls. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/customers/xls
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {integer} is_consumption.query - Type consumption ( 1 -> Consumption, 0/null -> Distribution)
 * @returns {object} 200 - {
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET entities customer listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/customers
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {string} keyword.query - Nama customer
 * @param {integer} is_consumption.query - Type consumption ( 1 -> Consumption, 0/null -> Distribution)
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET entities vendor listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/vendors
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {string} keyword.query - Nama vendor
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* EntityCustomer Model. */
/**
 * @typedef EntityCustomer
 * @property {Array.<integer>} customer_id.required - Customer Entity ID - Customer Entity ID\
 * @property {integer} is_consumption - Type consumption
 *
 */

/* PUT entities customers. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /entity/{id}/customers
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {EntityCustomer.model} data.body - Nama entitas / alamat
 * @returns {object} 200 - {
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entities xls. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/{id}/customers/xls
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {file} file.formData.required - File
 * @param {integer} is_consumption.query - Type consumption ( 1 -> Consumption, 0/null -> Distribution)
 * @returns {object} 200 - {
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/faskes-to-regency-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/faskes-to-faskes-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/out-building-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/in-building-puskesmas-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/in-building-cities-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/in-building-provinces-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* PUT entity update status. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /entity/{id}/status
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {UpdateStatus.model} data.body - Update - entity
 * @returns {object} 200 - {
 * "message": "Success mengupdate data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* POST entities xls. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entities/xls
 * @group Entity - Operations about entity
 * @param {file} file.formData.required - File XLS - entity
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
 * Get XLS template entity
 * @route GET /xls/template/entity
 * @group Entity - Operations about Entity
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/


/* GET entities track devices listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/track_devices
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {string} keyword.query - Nama vendor
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET history track devices listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/history/track_device/{nopol}
 * @group Entity - Operations about entity
 * @param {string} nopol.path - nopol
 * @param {string} start_date.query - start date - sample: "2020&mdash;01&mdash;01"
 * @param {string} end_date.query - end date - sample: "2021&mdash;11&mdash;26"
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "update_time": "2020&mdash;11&mdash;06 10:23:06", "curr_lat": "&mdash;6.13132", "curr_long": "106.8214111", "temp": "1.5" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET entities download list. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entities/xls
 * @group Entity - Operations about entity
 * @param {string} keyword.query - Nama entitas / alamat
 * @param {integer} entity_tag.query - Entity Tag ID
 * @param {integer} type.query - Entity Type (1. Provinsi, 2. Kota, 3. Faskes)
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* DELETE entity deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /entity/{id}/deletePKM
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* UPDATE entity deleting. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/{id}/updateMappingPKM
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {integer} regency_id.query - Regency ID
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* UPDATE entity bpom_key. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entities/updateBPOMKey
 * @group Entity - Operations about entity
 * @param {integer} entity_id.query - id entity
 * @param {integer} regency_id.query - Regency ID
 * @param {integer} province_id.query - Province ID
 * @param {integer} type.query - Type
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
