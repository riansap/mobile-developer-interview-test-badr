/* GET activity region. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/activity/region
 * @group Dashboard - Operations about region
 * @param {string} period.query - in days - eg: 20
 * @param {string} to.query - Tanggal akhir - eg: 2020-12
 * @param {integer} entityId.query - id entitas - eg: 1
 * @param {integer} page.query - page - eg: 1
 * @param {integer} perPage.query - per page - eg: 10
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */