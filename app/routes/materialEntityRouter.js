import express from 'express'
import * as commonController from '../controllers/commonController'
import parameterModel from '../helpers/parameterModel'
import * as materialEntityValidator from '../validators/materialEntityValidator'
import { validate } from '../validators'

const materialEntityRouter = express.Router()

/* GET material_entity listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /material-entities
 * @group MaterialEntity - Operations about material entity
 * @param {string} keyword.query - Material name with like condition
 * @param {integer} entity_id.query - Entity ID - 1
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{
 *     "id": 1,
 *     "material_id": 1,
 *     "entity_id": 1,
 *     "consumption_rate": 300,
 *     "retailer_price": 1000,
 *     "tax": 10,
 *     "min": 10,
 *     "max": 20,
 *     "material": {
 *       "id": 1,
 *       "name": "Vaksin Corona",
 *       "description": "unutk vaksin corona",
 *       "unit": "vial",
 *       "pieces_per_unit": 10,
 *       "temperature_sensitive": 10
 *     },
 *     "entity": {
 *       "name": "Dinas Kesehatan"
 *     }
 *   }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* MaterialEntity Model. */
/**
 * @typedef MaterialEntity
 * @property {number} material_id.required - 1 - Id material
 * @property {number} entity_id.required - 1 - Id entitas
 * @property {number} pieces_per_unit.required - 2 - Berapa banyak unit yang di masukan
 * @property {number} consumption_rate.required - 300 - Tingkat konsumsi
 * @property {number} retailer_price.required - 200 - Harga retail
 * @property {number} tax.required - 200 - Pajak
 * @property {number} min.required - 200 - Suhu minimum
 * @property {number} max.required - 200 - Suhu maximum
 *
 */

/**
 * This function comment is parsed by doctrine
 * @route POST /material-entity
 * @group MaterialEntity - Operations about material entity
 * @param {MaterialEntity.model} data.body Create - Material entity
 * @returns {object} 200 - {
 *   "id": 1,
 *   "material_id": 1,
 *   "entity_id": 1,
 *   "consumption_rate": 300,
 *   "retailer_price": 1000,
 *   "tax": 10,
 *   "min": 10,
 *   "max": 20
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */
/* POST material creating. */

materialEntityRouter.post(
  '/',
  validate(materialEntityValidator.create),
  parameterModel.define('MaterialEntity'),
  commonController.create
)

/* GET material entity detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /material-entity/{id}
 * @group MaterialEntity - Operations about material entity
 * @param {id} id.path - id material entity
 * @returns {object} 200 - {
 *   "id": 1,
 *   "material_id": 1,
 *   "entity_id": 1,
 *   "consumption_rate": 300,
 *   "retailer_price": 1000,
 *   "tax": 10,
 *   "min": 10,
 *   "max": 20
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

materialEntityRouter.get(
  '/:id',
  parameterModel.define('MaterialEntity'),
  commonController.detail
)

/* PUT inventory updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /material-entity/{id}
 * @group MaterialEntity - Operations about material entity
 * @param {id} id.path - id material entity
 * @param {MaterialEntity.model} data.body Update - MaterialEntity
 * @returns {object} 200 - {
 *   "id": 1,
 *   "material_id": 1,
 *   "entity_id": 1,
 *   "consumption_rate": 300,
 *   "retailer_price": 1000,
 *   "tax": 10,
 *   "min": 10,
 *   "max": 20
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

materialEntityRouter.put(
  '/:id',
  validate(materialEntityValidator.update),
  parameterModel.define('MaterialEntity'),
  commonController.update
)

/* DELETE inventory destroying. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /material-entity/{id}
 * @group MaterialEntity - Operations about material entity
 * @param {id} id.path - id material entity
 * @returns {object} 200 - { message: "success" }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */

materialEntityRouter.delete(
  '/:id',
  validate(materialEntityValidator.destroy),
  parameterModel.define('MaterialEntity'),
  commonController.destroy
)

export default materialEntityRouter

