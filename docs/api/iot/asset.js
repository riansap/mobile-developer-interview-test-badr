/* GET Asset listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /assets
 * @group Asset - Operations about Asset
 * @param {string} entity_id.query - id entitas
 * @param {string} type_id.query - id tipe
 * @param {string} name.query - name
 * @param {string} keyword.query - asset name, asset type, entity name
 * @param {integer} page.query - halaman
 * @param {integer} paginate.query - jumlah data
 * @returns {object} 200 - An array of Asset info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET Asset By Id. */
/**
 * This function comment is parsed by doctrine
 * @route GET /assets/{id}
 * @group Asset - Operations about Asset
 * @param {string} id.path.required - sample: 1
 * @returns {object} 200 - An array of Asset info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* Model asset. */
/**
 * @typedef Asset
 * @property {integer} type_id.required - Type Asset - eg:1
 * @property {string} lat.required - Lat Asset - eg:1.2
 * @property {string} lng.required - Lon Asset  - eg:-6
 * @property {integer} entity_id.required - Entitas Asset - eg:1
 * @property {integer} model_id.required - Model Asset - eg:1
 * @property {integer} manufacture.required - Manufacture Asset - eg:1
 * @property {string} prod_year - Prod Year - eg:2020
 * @property {string} serial_number - Serial Number - eg:AAABBB
 * @property {integer} created_by.required - Created by - eg:4
 * @property {integer} updated_by - Updated by user - eg:0
 * @property {Array.<AssetMaintainer>} maintainers.required - Entity ID user
 */

/**
 * @typedef AssetMaintainer
 * @property {integer} id.required - ID Maintainer - eg:1
 */

// POST Asset
/**
 * This function comment is parsed by doctrine
 * @route POST /assets
 * @group Asset - Operations about Asset
 * @param {Asset.model} data.body - 
 * @returns {object} 200 - An array of asset info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// UPDATE Asset
/**
 * This function comment is parsed by doctrine
 * @route put /assets/{id}
 * @group Asset - Operations about asset
 * @param {string} id.path.required - asset ID
 * @param {Asset.model} data.body test - 
 * @returns {object} 200 - An array of asset info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* Model asset. */
/**
 * @typedef UpdateAsset
 * @property {integer} status.required - Status Asset (0, 1) - eg:1
 */

// UPDATE Status Asset
/**
 * This function comment is parsed by doctrine
 * @route PUT /assets/{id}/status/
 * @group Asset - Operations about asset
 * @param {integer} id.path.required - asset ID
 * @param {UpdateAsset.model} data.body
 * @returns {Asset.model} 200 - asset info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// DELETE Asset
/**
 * This function comment is parsed by doctrine
 * @route DELETE /assets/{id}
 * @group Asset - Operations about asset
 * @param {string} id.path.required - Asset ID
 * @returns {object} 200 - An array of asset info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST assets xls. */
/**
 * This function comment is parsed by doctrine
 * @route POST /assets/xls
 * @group Asset - Operations about user
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
 * Get XLS Template Asset
 * @route GET /xls/template/asset
 * @group Asset - Operations about asset
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/
