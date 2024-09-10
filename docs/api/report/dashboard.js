/* GET dashboard overview. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/overview
 * @group Dashboard - Operations about Dashboard
 * @param {string} keyword.query - Nama - Keyword
 * @param {array} materialTags.query - Nama - Keyword
 * @param {integer} materialId.query - Nama - Keyword
 * @param {string} date.query - Nama - Keyword
 * @param {integer} period.query - Nama - Keyword
 * @param {integer} entity_tags.query - Nama - Keyword
 * @returns {object} 200 - {
 *  inventories: [{
 *     title: Normal
 *     items: 10
 *  },{
 *     title: Zero Stock,
 *     items: 10
 *  },{
 *     title: Min,
 *     items: 10
 * },{
 *     title: Max,
 *     items: 10
 * }],
 * activities: [
 *   { title: active, entities: 50 }
 *   { title: inactive, entities: 50 }
 * ],
 * total_entities: 100
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET transaction overview. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/transaction
 * @group Dashboard - Operations about Dashboard
 * @param {string} period.query - period - eg: monthly
 * @param {string} from.query - Tanggal awal - eg: 2020-01
 * @param {string} to.query - Tanggal akhir - eg: 2020-12
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET material overview. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/material
 * @group Dashboard - Operations about Dashboard
 * @param {string} period.query - period - eg: monthly, annual
 * @param {string} from.query - Tanggal awal - eg: 2020-01
 * @param {string} to.query - Tanggal akhir - eg: 2020-12
 * @param {integer} entityId.query - id entitas - eg: 1
 * @param {string} materialTags.query - material tags - eg: 1,2,3
 * @param {integer} page.query - page - eg: 1
 * @param {integer} perPage.query - per page - eg: 10
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET material download. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/material/download
 * @group Dashboard - Operations about Dashboard
 * @param {string} period.query - period - eg: monthly, annual
 * @param {string} from.query - Tanggal awal - eg: 2020-01
 * @param {string} to.query - Tanggal akhir - eg: 2020-12
 * @param {integer} entityId.query - id entitas - eg: 1
 * @param {string} materialTags.query - material tags - eg: 1,2,3
 * @param {string} token.query - token for download - eg: eyJhbGciOiJIUzI1NiIs...
 * @param {integer} page.query - page - eg: 1
 * @param {integer} perPage.query - per page - eg: 10
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 */

/* GET inventory region. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/inventory/region
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

/* GET ASSET region. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/asset/region
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

/* GET material list. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/material/list
 * @group Dashboard - Operations about Dashboard
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET entity Tags. */
/**
 * This function comment is parsed by doctrine
 * @route GET /dashboard/entityTags
 * @group Dashboard - Operations about Dashboard
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
