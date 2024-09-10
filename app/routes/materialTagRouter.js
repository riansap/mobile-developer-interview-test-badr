import express from 'express'
import { validate } from '../validators'
import * as materialTagValidator from '../validators/materialTagValidator'
import parameterModel from '../helpers/parameterModel'
import * as commonController from '../controllers/commonController'

const materialTagRouter = express.Router()

/* Material Tag Model. */
/**
 * @typedef MaterialTag
 * @property {string} title.required - Routine - Material tag title
 * @property {number} is_ordered_sales - Routine - Material tag title
 * @property {number} is_ordered_purchase - Routine - Material tag title
 */

/* GET material tags listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /material-tags
 * @group MaterialTag - Operations about material tag
 * @param {string} keyword.query - Title material tag
 * @param {integer} is_ordered_purchase.query - Is Ordered purchase
 * @param {integer} is_ordered_sales.query - Is Ordered sales
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 * "total": 0,
 * "page": 1,
 * "perPage": 10,
 * "list": [{
 *   "id": 1,
 *   "title": "Routine"
 *  }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* POST material tag creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /material-tag
 * @group MaterialTag - Operations about batch
 * @param {MaterialTag.model} data.body Create - Material Tag
 * @returns {object} 201 - {}
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */
materialTagRouter.post(
  '/',
  validate(materialTagValidator.create),
  parameterModel.define('MaterialTag'),
  commonController.create
)

/* GET material tag detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /material-tag/{id}
 * @group MaterialTag - Operations about material tag
 * @param {id} id.path - id material tag
 * @returns {object} 201 - {}
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */
materialTagRouter.get(
  '/:id',
  parameterModel.define('MaterialTag'),
  commonController.detail
)


/* PUT batch updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /material-tag/{id}
 * @group MaterialTag - Operations about material tag
 * @param {id} id.path - id material tag
 * @param {MaterialTag.model} data.body Update - MaterialTag
 * @returns {object} 201 - {
 *  "id": 1,
 *  "title": "Routine"
 * }
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */
materialTagRouter.put(
  '/:id',
  validate(materialTagValidator.update),
  parameterModel.define('MaterialTag'),
  commonController.update
)

/* DELETE batch deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /material-tag/{id}
 * @param {id} id.path - id material tag
 * @group MaterialTag - Operations about material tag
 * @returns {object} 201 - {
 *  "id": 1,
 *  "title": "Routine"
 * }
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */
materialTagRouter.delete(
  '/:id',
  parameterModel.define('MaterialTag'),
  commonController.destroy
)

export default materialTagRouter
