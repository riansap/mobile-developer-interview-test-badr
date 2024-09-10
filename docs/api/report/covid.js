/* GET dashboard overview. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/covid/overview
 * @group Dashboard - Operations about Covid Dashboard
 * @param {array} materialTags.query - Nama - Keyword
 * @param {integer} provinceEntityId.query - Nama - Keyword
 * @param {string} regencyEntityId.query - Nama - Keyword
 * @param {integer} entityId.query - Nama - Keyword
 * @param {date} from.query - Nama - Keyword
 * @param {date} to.query - Nama - Keyword
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET dashboard overview. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/covid/overview/download
 * @group Dashboard - Operations about Covid Dashboard Download
 * @param {string} materialTags.query - Material tags - Materialtags
 * @param {integer} provinceEntityId.query - Nama -
 * @param {integer} regencyEntityId.query - Nama - Keyword
 * @param {integer} entityId.query - Nama - Keyword
 * @param {date} from.query - Nama - Keyword
 * @param {date} to.query - Nama - Keyword
 * @param {string} token.query - Nama - Bearer
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 */
