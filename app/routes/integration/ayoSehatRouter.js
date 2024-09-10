import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import * as ayosehatController from '../../controllers/integration/ayoSehatController'
import { create } from '../../controllers/commonController'
import { validate } from '../../validators'
import * as ayoSehatValidator from '../../validators/integration/ayoSehatValidator'

const ayoSehatRouter = express.Router()

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

ayoSehatRouter.post(
  '/consumption/:customer_id',
  parameterModel.define('IntegrationAyoSehat'),
  create
)

ayoSehatRouter.put(
  '/consumption/:customer_id/accept/:id',
  validate(ayoSehatValidator.general),
  parameterModel.custom('IntegrationAyoSehat', ayosehatController.acceptConsumption)
)

ayoSehatRouter.put(
  '/consumption/:customer_id/return/:id',
  validate(ayoSehatValidator.general),
  parameterModel.custom('IntegrationAyoSehat', ayosehatController.returnConsumption)
)

ayoSehatRouter.put(
  '/consumption/:customer_id/return/:id/accept',
  validate(ayoSehatValidator.general),
  (req, res) => { return res.status(200).json(req.body) },
  parameterModel.custom('IntegrationAyoSehat', ayosehatController.returnConsumptionAccept)
)

export default ayoSehatRouter
