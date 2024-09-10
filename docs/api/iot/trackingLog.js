/* GET TrackingLog listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /tracking-logs
 * @group TrackingLog - Operations about tracking Log
 * @param {string} no_do.query - sample: DO123
 * @param {string} do_id.query - sample: 1
 * @param {string} nopol.query - sample: UNDP01
 * @param {integer} page.query - sample: 1
 * @param {integer} paginate.query - sample: 10
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET Temperature TrackingLog listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /tracking-logs/temperature
 * @group TrackingLog - Operations about temperature tracking Log
 * @param {string} no_do.query - sample: DO123
 * @param {string} do_id.query - sample: 1
 * @param {string} nopol.query - sample: UNDP01
 * @returns {object} 200 - An array of temperature tracking info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET TrackingLog By Id. */
/**
 * This function comment is parsed by doctrine
 * @route GET /tracking-logs/{id}
 * @group TrackingLog - Operations about TrackingLog
 * @param {string} id.path.required - sample: 1
 * @returns {object} 200 - An array of TrackingLog info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// POST tracking-logs
/**
 * This function comment is parsed by doctrine
 * @route POST /tracking-logs
 * @group TrackingLog - Operations about tracking log
 * @param {TrackingLogModel.model} data.body - add tracking log
 * @returns {object} 200 - An array of trackingLog info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// UPDATE TrackingLog
/**
 * This function comment is parsed by doctrine
 * @route put /tracking-logs/{id}
 * @group TrackingLog - Operations about trackingLog
 * @param {string} id.path.required - TrackingLog ID - TrackingLog ID 
 * @param {TrackingLog.model} data.body test - Some Name description - Data body - example
 * @returns {object} 200 - An array of trackingLog info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// DELETE users
/**
 * This function comment is parsed by doctrine
 * @route DELETE /tracking-logs/{id}
 * @group TrackingLog - Operations about trackingLog
 * @param {string} id.path.required - trackingLog ID - trackingLog ID
 * @returns {object} 200 - An array of trackingLog info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
