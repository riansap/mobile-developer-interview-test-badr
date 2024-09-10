/* GET AssetType listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /asset-type
 * @group AssetType - Operations about AssetType
 * @param {string} keyword.query - field_name = value
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - An array of AssetType info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// POST AssetType
/**
 * This function comment is parsed by doctrine
 * @route POST /asset-type
 * @group AssetType - Operations about Asset Type
 * @param {AssetType.model} data.body - all field
 * @returns {object} 200 - An array of asset type info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// UPDATE AssetType
/**
 * This function comment is parsed by doctrine
 * @route put /asset-type/{id}
 * @group AssetType - Operations about asset type
 * @param {string} id.path.required - AssetType ID - assetType ID
 * @param {AssetType.model} data.body test - Some Name description - Data body - example
 * @returns {object} 200 - An array of asset type info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// DELETE AssetType
/**
 * This function comment is parsed by doctrine
 * @route DELETE /asset-type/{id}
 * @group AssetType - Operations about asset type
 * @param {string} id.path.required - AssetType ID - AssetType ID
 * @returns {object} 200 - An array of asset type info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
