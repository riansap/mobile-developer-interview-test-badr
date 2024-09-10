import express from 'express'
import * as commonController from '../controllers/commonController'
import * as materialController from '../controllers/materialController'
import models from '../models'
import parameterModel from '../helpers/parameterModel'
import * as materialValidator from '../validators/materialValidator'
import { validate } from '../validators'
import { hasRole } from '../middlewares/authMiddleware'

const {
  Material
} = models

const materialRouter = express.Router()

/* GET materials listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /materials
 * @group Material - Operations about material
 * @param {string} keyword.query - Nama material
 * @param {integer} status.query - Status Material
 * @param {integer} material_tag_id.query - Material Tag ID 
 * @param {integer} is_vaccine.query - is vaccine(0/1) - 1
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{
 *     "id": 1,
 *     "name": "Vaksin Corona",
 *     "description": "Vaksin untuk corona",
 *     "unit": "vial",
 *     "pieces_per_unit": 1000,
 *     "temperature_sensitive": 1
 *     "temperature_min": 100,
 *     "temperature_max": 1000,
 *   }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* Material Condition Model. */
/**
 * @typedef MaterialCondition
 * @property {Array.<integer>} entity_types - Entity Type - eg: [1,2]
 * @property {Array.<integer>} roles - Roles - eg: [1,2]
 */

/* Material Model. */
/**
 * @typedef Material
 * @property {string} name.required - Vaksin corona - nama material - eg:Material
 * @property {string} description.required - Vaksin untuk corona - Deskripsi material - eg:Deskripsi sebuah material
 * @property {integer} pieces_per_unit.required - 2 - Berapa banyak unit yang di masukan - eg:1
 * @property {string} unit.required - vial - Satuan unit - eg:buah
 * @property {integer} temperature_sensitive - 1 - Indikator temperatur sensitif - eg: 1
 * @property {number} temperature_min.required - 100 - Minimum stock - eg: 0
 * @property {number} temperature_max.required - 1000 - Maximum stock - eg:30
 * @property {integer} managed_in_batch - Managed in Batch - eg:1
 * @property {string} code - Code - eg: MATERIALCODE
 * @property {Array.<integer>} material_companion - Material Companion - eg: [1,2]
 * @property {Array.<integer>} material_tags - Material Tag - eg: [1,2]
 * @property {Array.<integer>} manufactures - Manufacture - eg: [1,2]
 * @property {MaterialCondition.model} stockcount - object {entity_types: [], roles: []}
 * @property {MaterialCondition.model} addremove - object {entity_types: [], roles: []}
 * @property {integer} is_stockcount - is_stockcount (0, 1) - eg: 1
 * @property {integer} is_addremove - is_addremove (0, 1) - eg: 1
 */
 
/* POST material creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /material
 * @group Material - Operations about material
 * @param {Material.model} data.body Create - Material
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

/* GET material detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /material/{id}
 * @group Material - Operations about material
 * @param {id} id.path - id material
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

materialRouter.get(
  '/:id',
  parameterModel.custom('Material', materialController.detail),
  commonController.detail
)

/* PUT material updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /material/{id}
 * @group Material - Operations about material
 * @param {id} id.path - id material
 * @param {Material.model} data.body Update - Material
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

/* DELETE material destroying. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /material/{id}
 * @group Material - Operations about material
 * @param {id} id.path - id material
 * @returns {object} 200 - { message: "success" }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

materialRouter.delete(
  '/:id',
  parameterModel.define('Material'),
  commonController.destroy
)

/* PUT material update status. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /material/{id}/status
 * @group Material - Operations about material
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
  parameterModel.define(Material),
  commonController.update
)

/* GET material xls. */
/**
 * Download material
 * @route GET /materials/xls
 * @group Material - Operations about material
 * @param {string} keyword.query - Nama material
 * @param {integer} status.query - Status Material
 * @param {integer} material_tag_id.query - Material Tag ID
 * @param {integer} is_vaccine.query - is vaccine(0/1) - 1
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* POST material xls. */
/**
 * This function comment is parsed by doctrine
 * @route POST /materials/xls
 * @group Material - Operations about material
 * @param {file} file.formData.required - File XLS - material
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* GET template xls. */
/**
 * Get XLS template Material
 * @route GET /xls/template/material
 * @group Material - Operations about Material
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

export default materialRouter

