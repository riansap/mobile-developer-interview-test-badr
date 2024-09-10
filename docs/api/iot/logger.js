/* GET Logger listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /loggers
 * @group Logger - Operations about logger
 * @param {string} asset_id.query - sample: 1
 * @param {string} serial_number.query - sample: '002'
 * @param {integer} page.query - sample: 1
 * @param {integer} paginate.query - sample: 10
 * @returns {object} 200 - An array of user info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET Logger By Id. */
/**
 * This function comment is parsed by doctrine
 * @route GET /loggers/{id}
 * @group Logger - Operations about Logger
 * @param {string} id.path.required - sample: 1
 * @returns {object} 200 - An array of TrackingLog info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// POST loggers
/**
 * This function comment is parsed by doctrine
 * @route POST /loggers
 * @group Logger - Operations about logger
 * @param {string} serial_number.param - sample: '987-572-998-343'
 * @param {string} prod_year.param - sample: '1990'
 * @param {string} gsm_no.param - sample: '0812347584959'
 * @param {string} location.param - sample: 'Jakarta'
 * @param {string} vendor.param - sample: 'Telkomsel'
 * @param {integer} asset_id.param - sample: 13
 * @param {string} position.param - sample: 'Main'
 * @param {float} min.param - sample: -6.0
 * @param {float} max.param - sample: 5.0
 * @param {string} temp.param - sample: '2.0'
 * @returns {object} 200 - An array of logger info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// UPDATE Logger
/**
 * This function comment is parsed by doctrine
 * @route put /loggers/{id}
 * @group Logger - Operations about logger
 * @param {string} id.path.required - Logger ID - Logger ID 
 * @param {Logger.model} data.body test - Some Name description - Data body - example
 * @returns {object} 200 - An array of logger info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// UPDATE Status Logger
/**
 * This function comment is parsed by doctrine
 * @route PUT /loggers/{id}/status/
 * @group Logger - Operations about logger
 * @param {integer} id.path.required - logger ID
 * @param {integer} status.body - sample: {
 * "status": 1
 * }
 * @returns {object} 200 - asset info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

// DELETE users
/**
 * This function comment is parsed by doctrine
 * @route DELETE /loggers/{id}
 * @group Logger - Operations about logger
 * @param {string} id.path.required - logger ID - logger ID
 * @returns {object} 200 - An array of logger info
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
