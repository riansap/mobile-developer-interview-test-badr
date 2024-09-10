import express from 'express'
import * as emonevController from '../../controllers/integration/emonevController'
import { validate } from '../../validators'
import * as emonevValidator from '../../validators/integration/emonevValidator'

const emonevRouter = express.Router()

/**
 * GET stock listing
 * @route GET /v2/stocks
 * @group Stock V2 - Operations about stock
 * @param {string} keyword.query - name master activity
 * @param {integer} activity_id.query - Activity ID
 * @param {integer} entity_id.query - Entity ID
 * @param {integer} material_id.query - Material ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 * "total": 0,
 * "page": 1,
 * "perPage": 10,
 * "list": [{
 *   "id": 1,
 *   "name": "Routine"
 *  }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

emonevRouter.get('/province',
  validate(emonevValidator.dataProvince),
  emonevController.listDataProvince
)

emonevRouter.get('/regency',
  validate(emonevValidator.dataRegency),
  emonevController.listDataRegency
)


export default emonevRouter
