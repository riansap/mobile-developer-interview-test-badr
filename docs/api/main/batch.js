// /* Batch Model. */
// /**
//  * @typedef Batch
//  * @property {string} code.required - ABC123  - Code Batch - eg:AABBB
//  * @property {string} expired_date.required - date - batch expired date batch - eg:2020-12-31
//  * @property {string} production_date.required - date - batch production date - eg:2020-12-31
//  * @property {integer} manufacture_id.required - Manufacture ID - eg: 1
//  *
//  */

/* GET batches listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /batches
 * @group Batch - Operations about material
 * @param {string} keyword.query - Code batch with like condition
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 * "total": 0,
 * "page": 1,
 * "perPage": 10,
 * "list": [{
 *   "id": 1,
 *   "code": "ABC123",
 *   "expired_date": "",
 *   "production_date": ""
 *  }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* POST batch creating. */
// /**
//  * This function comment is parsed by doctrine
//  * @route POST /batch
//  * @group Batch - Operations about batch
//  * @param {Batch.model} data.body Create - Batch
//  * @returns {object} 201 - {
//  *   "id": 1,
//  *   "code": "ABC123",
//  *   "expired_date": "",
//  *   "production_date": ""
//  * }
//  * @returns {Error} default 500 - { message: "Internal server error" }
//  * @security [{"JWT":[]}]
//  */
// router.post(
//   '/',
//   validate(batchValidator.create),
//   parameterModel.define('Batch'),
//   commonController.create
// )

/* GET batch detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /batch/{id}
 * @group Batch - Operations about batch
 * @param {id} id.path - id batch
 * @returns {object} 201 - {
 *   "id": 1,
 *   "code": "ABC123",
 *   "expired_date": "date",
 *   "production_date": "date"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

/* PUT batch updating. */
// /**
//  * This function comment is parsed by doctrine
//  * @route PUT /batch/{id}
//  * @group Batch - Operations about batch
//  * @param {id} id.path - id batch
//  * @param {Batch.model} data.body Update - Batch
//  * @returns {object} 201 - {
//  *  "id": 1,
//  *  "code": "ABC123",
//  *  "expired_date": "",
//  *  "production_date": ""
//  * }
//  * @returns {Error} default 500 - { message: "Internal server error" }
//  * @security [{"JWT":[]}]
//  */
// router.put(
//   '/:id',
//   validate(batchValidator.update),
//   parameterModel.define('Batch'),
//   commonController.update
// )

/* DELETE batch deleting. */
// /**
//  * This function comment is parsed by doctrine
//  * @route DELETE /batch/{id}
//  * @param {id} id.path - id batch
//  * @group Batch - Operations about batch
//  * @returns {object} 201 - {
//  *  "id": 1,
//  *  "code": "ABC123",
//  *  "expired_date": "",
//  *  "production_date": ""
//  * }
//  * @returns {Error} default 500 - { message: "Internal server error" }
//  * @security [{"JWT":[]}]
//  */
// router.delete(
//   '/:id',
//   parameterModel.define('Batch'),
//   commonController.destroy
// )
