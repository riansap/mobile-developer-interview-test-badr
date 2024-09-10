import express from 'express'

import * as commonController from '../../controllers/commonController'
import * as materialController from '../../controllers/v2/materialController'

import * as materialValidator from '../../validators/v2/materialValidator'

import parameterModel from '../../helpers/parameterModel'
import { hasRole } from '../../middlewares/authMiddleware'
import { validate } from '../../validators'

const materialRouter = express.Router()

/**
 * GET material listing
 * @route GET /v2/materials
 * @group Material V2 - Operations about material
 * @param {string} keyword.query - name material
 * @param {integer} status.query - Status Material
 * @param {integer} activity_id.query - Activity ID
 * @param {integer} is_vaccine.query - is vaccine(0/1) - 1
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 * "total": 0,
 * "page": 1,
 * "perPage": 10,
 * "list": [{
 *     "id": 1,
 *     "name": "Vaksin Corona",
 *     "description": "Vaksin untuk corona",
 *     "unit": "vial",
 *     "pieces_per_unit": 1000,
 *     "temperature_sensitive": 1
 *     "temperature_min": 100,
 *     "temperature_max": 1000,
 *  }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/**
 * GET material detail
 * @route GET /v2/material/{id}
 * @group Material V2 - Operations about material
 * @param {id} id.path - id material
 * @returns {object} 201 - {}
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */
materialRouter.get(
  '/:id',
  parameterModel.custom('MasterMaterial', materialController.detail),
  commonController.detail
)

/* Material Model. */
/**
 * @typedef Material2
 * @property {string} name.required - Vaksin corona - nama material - eg:Material
 * @property {string} code - Code - eg: MATERIALCODE
 * @property {string} description - description - eg:Material Description
 * @property {integer} pieces_per_unit.required - 2 - Berapa banyak unit yang di masukan - eg:1
 * @property {string} unit.required - vial - Satuan unit - eg:buah
 * @property {integer} temperature_sensitive - 1 - Indikator temperatur sensitif - eg: 1
 * @property {number} temperature_min.required - 100 - Minimum stock - eg: 0
 * @property {number} temperature_max.required - 1000 - Maximum stock - eg:30
 * @property {integer} managed_in_batch - Managed in Batch - eg:1
 * @property {Array.<integer>} activities - Material Activity ID - eg: [1,2]
 * @property {integer} is_addremove - is_addremove (0, 1) - eg: 1
 * @property {MaterialCondition.model} addremove - object {entity_types: [], roles: []}
 * @property {Array.<integer>} manufactures - Manufacture - eg: [1,2]
 * @property {Array.<integer>} material_companion - Material Companion - eg: [1,2]
 */
 
/**
 * POST material creating
 * @route POST /v2/material
 * @group Material V2 - Operations about material
 * @param {Material2.model} data.body Create - Material
 * @returns {object} 201 - {
 * "id" : 1,
 * "name": "Vaksin Corona",
 * "description": "Vaksin untuk corona",
 * "unit": "vial",
 * "pieces_per_unit": 2000,
 * "temperature_sensitive": 1,
 * "temperature_min": 100,
 * "temperature_max": 1000,
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

materialRouter.post(
  '/',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(materialValidator.create),
  materialController.create
)

/**
 * PUT material updating
 * @route PUT /v2/material/{id}
 * @group Material V2 - Operations about material
 * @param {id} id.path - id material
 * @param {Material2.model} data.body Update - Material
 * @returns {object} 200 - {
 * "id" : 1,
 * "name": "Vaksin Corona",
 * "description": "Vaksin untuk corona",
 * "pieces_per_unit": 1,
 * "unit": "vial",
 * "temperature_sensitive": 1,
 * "temperature_min": 100,
 * "temperature_max": 1000,
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

materialRouter.put(
  '/:id',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(materialValidator.update),
  materialController.update,
)

/**
 * DELETE material destroying.
 * @route DELETE /v2/material/{id}
 * @group Material V2 - Operations about material
 * @param {id} id.path - id material
 * @returns {object} 200 - { message: "success" }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

materialRouter.delete(
  '/:id',
  parameterModel.define('MasterMaterial'),
  commonController.destroy
)

/**
 * update status material
 * @route PUT /v2/material/{id}/status
 * @group Material V2 - Operations about material
 * @param {id} id.path - id material
 * @param {UpdateStatus.model} data.body - Update - material
 * @returns {object} 200 - {
 * "message": "Success mengupdate data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/
materialRouter.put(
  '/:id/status',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(materialValidator.updateMaterialStatus),
  materialController.updateStatus
)

export default materialRouter
