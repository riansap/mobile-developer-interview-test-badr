/* OrderTag Model. */
/**
 * @typedef OrderTag
 * @property {string} title.required - 1 - Judul order tag
 */

/* GET order tag listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /order-tags
 * @group OrderTag - Operations about order tag
 * @param {string} keyword.query - Keyword - order tag
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{
 *     "id": 1,
 *     "title": 1
 *   }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
