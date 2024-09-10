/* GET AssetModel listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /asset-model
 * @group AssetModel - Operations about AssetModel
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - An array of AssetModel info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// POST AssetModel
/**
 * This function comment is parsed by doctrine
 * @route POST /asset-model
 * @group AssetModel - Operations about Asset Model
 * @param {AssetModel.model} data.body - all field
 * @returns {object} 200 - An array of asset model info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// UPDATE AssetModel
/**
 * This function comment is parsed by doctrine
 * @route put /asset-model/{id}
 * @group AssetModel - Operations about asset Model
 * @param {string} id.path.required - AssetModel ID
 * @param {AssetModel.model} data.body test - Some Name description - Data body - example
 * @returns {object} 200 - An array of asset model info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// DELETE AssetModel
/**
 * This function comment is parsed by doctrine
 * @route DELETE /asset-model/{id}
 * @group AssetModel - Operations about asset model
 * @param {string} id.path.required - AssetModel ID - AssetModel ID
 * @returns {object} 200 - An array of asset model info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
