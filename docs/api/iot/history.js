/* GET History listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /histories
 * @group History - Operations about History
 * @param {string} asset_id.query - sample: 1
 * @param {integer} page.query - sample: 1
 * @param {integer} paginate.query - sample: 10
 * @returns {object} 200 - An array of history info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// POST History
/**
 * This function comment is parsed by doctrine
 * @route POST /history
 * @group History - Operations about history
 * @param {History.model} data.body - all field
 * @returns {object} 200 - An array of history info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// UPDATE History
/**
 * This function comment is parsed by doctrine
 * @route PATCH /histories/{id}
 * @group History - Operations about history
 * @param {string} id.path.required - History ID - History ID 
 * @param {History.model} data.body test - Some Name description - Data body - example
 * @returns {object} 200 - An array of history info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// DELETE users
/**
 * This function comment is parsed by doctrine
 * @route DELETE /histories/{id}
 * @group History - Operations about history
 * @param {string} id.path.required - History ID - History ID
 * @returns {object} 200 - An array of history info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
