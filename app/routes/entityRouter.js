import express from 'express'
import * as commonController from '../controllers/commonController'
import * as entityController from '../controllers/entityController'
import models from '../models'
import parameterModel from '../helpers/parameterModel'
import * as entityValidator from '../validators/entityValidator'
import { validate } from '../validators'
import { hasRole } from '../middlewares/authMiddleware'
import * as relationValidator from '../validators/relationValidator'

import { entityCustomerXlsSchema } from '../helpers/xls/xlsValidationSchema'
import uploadFile from '../middlewares/upload'
import { uploadXLS, downloadData } from '../controllers/excelController'

const { Entity } = models

const entityRouter = express.Router()

/* Entity Model. */
/**
 * @typedef Entity
 * @property {string} name.required - Nama entitas - eg:Dinas Kesahatan
 * @property {string} address.required - Alamat entitas - eg:Jakarta timur
 * @property {integer} type.required - Type - eg:1
 * @property {integer} status - Status (0 disable, 1 active) - eg: 1
 * @property {integer} province_id - Province ID - eg:1
 * @property {integer} regency_id - Regency ID - eg:1
 * @property {integer} village_id - Village ID - eg:1
 * @property {integer} sub_district_id - Subdistrict ID - eg:1
 * @property {double} lat - Latitude - eg:-6.574722
 * @property {double} lng - Longitude - eg:106.801293
 * @property {integer} postal_code - Postal Code - eg:16161
 * @property {string} country - Country - eg:Indonesia
 * @property {string} code - Code - eg:ENTITYCODE
 * @property {Array.<integer>} entity_tags - Entity Tag - eg:[1]
 * @property {integer} is_puskesmas - Is Puskesmas(0/1) - eg:0
 * @property {string} rutin_join_date - rutin_join_date -  eg:2022-03-29
 *
 */

/* GET entities listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entities
 * @group Entity - Operations about entity
 * @param {string} keyword.query - Nama entitas / alamat
 * @param {integer} entity_tag.query - Entity Tag ID
 * @param {integer} is_vendor.query - Is Vendor (0,1)
 * @param {integer} type.query - Entity Type (1. Provinsi, 2. Kota, 3. Faskes)
 * @param {integer} nonbasic_type.query - NonBasic Type (other type from 1,2,3,4) (0,1)
 * @param {integer} province_id.query - Province ID
 * @param {integer} regency_id.query - Regency ID
 * @param {integer} village_id.query - Village ID
 * @param {integer} sub_district_id.query - Sub District ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* POST entity creating. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity
 * @group Entity - Operations about entity
 * @param {Entity.model} data.body Create - Entitas
 * @returns {object} 201 - {
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "timezone":[]}]
 */

entityRouter.post(
  '/',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(entityValidator.create),
  relationValidator.provinceRegencySubDistrictVillage,
  // parameterModel.define(Entity),
  entityController.create
)

/* GET entity updating. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "timezone":[]}]
 */

entityRouter.get(
  '/:id',
  parameterModel.custom(Entity, entityController.detail),
  commonController.detail
)

/* PUT entity updating. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /entity/{id}
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {Entity.model} data.body Update - Entitas
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[], "timezone":[]}]
 */

entityRouter.put(
  '/:id',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(entityValidator.update),
  relationValidator.provinceRegencySubDistrictVillage,
  // parameterModel.define(Entity),
  entityController.update
)

/* DELETE entity deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /entity/{id}
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.delete(
  '/:id',
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.define(Entity),
  commonController.destroy
)

/* GET entities xls. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/customers/xls
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {integer} is_consumption.query - Type consumption ( 1 -> Consumption, 0/null -> Distribution)
 * @param {integer} entity_tag_id.query - entity_tag_id
 * @returns {object} 200 - {
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
entityRouter.get(
  '/:id/customers/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('CustomerVendor', entityController.listCustomerXLS),
  downloadData
)

/* GET entities customer listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/customers
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {string} keyword.query - Nama customer
 * @param {integer} is_consumption.query - Type consumption ( 1 -> Consumption, 0/null -> Distribution)
 * @param {integer} entity_tag_id.query - entity_tag_id
 * @param {integer} province_id.query - province_id
 * @param {integer} regency_id.query - regency_id
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.get('/:id/customers', entityController.listEntityChild)

/* GET entities vendor listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/vendors
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {string} keyword.query - Nama vendor
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.get('/:id/vendors', entityController.listEntityChild)

/* EntityCustomer Model. */
/**
 * @typedef EntityCustomer
 * @property {Array.<integer>} customer_id.required - Customer Entity ID - Customer Entity ID\
 * @property {integer} is_consumption - Type consumption
 *
 */

/* PUT entities customers. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /entity/{id}/customers
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {EntityCustomer.model} data.body - Nama entitas / alamat
 * @returns {object} 200 - {
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.put(
  '/:id/customers',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.addCustomer
)

/* POST entities xls. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/{id}/customers/xls
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {file} file.formData.required - File
 * @param {integer} is_consumption.query - Type consumption ( 1 -> Consumption, 0/null -> Distribution)
 * @returns {object} 200 - {
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
entityRouter.post(
  '/:id/customers/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  uploadFile.single('file'),
  parameterModel.define('CustomerVendor'),
  entityCustomerXlsSchema,
  uploadXLS
)

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/faskes-to-regency-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.post(
  '/customer/vendor/faskes-to-regency-generate',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.faskesToRegencyGenerate
)

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/faskes-to-faskes-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.post(
  '/customer/vendor/faskes-to-faskes-generate',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.faskesToFaskesGenerate
)

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/out-building-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.post(
  '/customer/vendor/out-building-generate',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.outBuildingGenerate
)

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/in-building-puskesmas-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.post(
  '/customer/vendor/in-building-puskesmas-generate',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.inBuildingPuskesmasGenerate
)

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/in-building-cities-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.post(
  '/customer/vendor/in-building-cities-generate',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.inBuildingCitiesGenerate
)

/* POST entities customers faskes. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/customer/vendor/in-building-provinces-generate
 * @group Entity - Operations about entity
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *  "message": "success"
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.post(
  '/customer/vendor/in-building-provinces-generate',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.inBuildingProvincesGenerate
)

/* PUT entity update status. */
/**
 * This function comment is parsed by doctrine
 * @route PUT /entity/{id}/status
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {UpdateStatus.model} data.body - Update - entity
 * @returns {object} 200 - {
 * "message": "Success mengupdate data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
entityRouter.put(
  '/:id/status',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(entityValidator.updateEntityStatus),
  parameterModel.define(Entity),
  commonController.update
)

/* POST entities xls. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entities/xls
 * @group Entity - Operations about entity
 * @param {file} file.formData.required - File XLS - entity
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
 * Get XLS template entity
 * @route GET /xls/template/entity
 * @group Entity - Operations about Entity
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* GET entities track devices listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/{id}/track_devices
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {string} keyword.query - Nama vendor
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.get('/:id/track_devices', entityController.listTrackDevices())

/* GET history track devices listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity/history/track_device/{nopol}
 * @group Entity - Operations about entity
 * @param {string} nopol.path - nopol
 * @param {string} start_date.query - start date - sample: "2020&mdash;01&mdash;01"
 * @param {string} end_date.query - end date - sample: "2021&mdash;11&mdash;26"
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "update_time": "2020&mdash;11&mdash;06 10:23:06", "curr_lat": "&mdash;6.13132", "curr_long": "106.8214111", "temp": "1.5" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.get(
  '/history/track_device/:nopol',
  entityController.historyTrackDevice()
)

/* GET entities download list. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entities/xls
 * @group Entity - Operations about entity
 * @param {string} keyword.query - Nama entitas / alamat
 * @param {integer} entity_tag.query - Entity Tag ID
 * @param {integer} type.query - Entity Type (1. Provinsi, 2. Kota, 3. Faskes)
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

/* DELETE entity deleting. */
/**
 * This function comment is parsed by doctrine
 * @route DELETE /entity/{id}/deletePKM
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
entityRouter.delete(
  '/:id/deletePKM',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.destroyPKM
)

/* UPDATE entity deleting. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entity/{id}/updateMappingPKM
 * @group Entity - Operations about entity
 * @param {id} id.path - id entity
 * @param {integer} regency_id.query - Regency ID
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
entityRouter.post(
  '/:id/updateMappingPKM',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.updateMappingPKM
)

/* UPDATE entity bpom_key. */
/**
 * This function comment is parsed by doctrine
 * @route POST /entities/updateBPOMKey
 * @group Entity - Operations about entity
 * @param {integer} entity_id.query - id entity
 * @param {integer} regency_id.query - Regency ID
 * @param {integer} province_id.query - Province ID
 * @param {integer} type.query - Type
 * @returns {object} 200 - {
 * "id": 1,
 * "name": "Dinas Kesehatan",
 * "address": "Jakarta timur"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

entityRouter.put(
  '/:id/submitBPOM',
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.submitBPOM
)

export default entityRouter
