import express from 'express'

import { list } from '../../controllers/commonController'
import { uploadXLS, downloadData } from '../../controllers/excelController'
import {  
  masterIPVList, 
  masterTargetDistributionList, 
  masterDataIPVXlsSchema, 
  masterDataDistributionXlsSchema 
} from '../../controllers/v2/masterDataController'

import parameterModel from '../../helpers/parameterModel'

import * as xlsValidator from '../../validators/xlsValidator'
import { validate } from '../../validators'

import { hasRole } from '../../middlewares/authMiddleware'
import uploadFile from '../../middlewares/upload'

const masterDataRouter = express.Router()

/**
 * Download list master IPVs XLS
 * @route GET /v2/master_data/master_ipvs/xls
 * @group MasterData - Operations about MasterData
 * @param {string} keyword.query - Keyword - keyword filter
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
masterDataRouter.get('/master_ipvs/xls',
  parameterModel.custom('MasterIPV', masterIPVList),
  downloadData)

/**
 * Get list master IPVs
 * @route GET /v2/master_data/master_ipvs
 * @group MasterData - Operations about MasterData
 * @param {string} keyword.query - Keyword - keyword filter
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
masterDataRouter.get('/master_ipvs',
  parameterModel.custom('MasterIPV', masterIPVList),
  list)

/* GET template xls. */
/**
 * Get XLS Template Master IPV v2
 * @route GET /xls/template/master_ipvs_v2
 * @group MasterData - Operations about MasterData
 * @returns {object} 200 - {
 * "message": "Success menghapus data"
 * }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* POST master_ipvs xls. */
/**
* Upload master_ipvs
* @route POST /v2/master_data/master_ipvs/xls
* @group MasterData - Operations about MasterData
* @param {file} file.formData.required - File XLS - Master IPV
* @returns {object} 200 - {
* "message": "Success menghapus data"
* }
* @returns {object} 404 - {
*   "error": "Data not found"
* }
* @returns {Error} default 500 - { message: "Internal server error" }
* @security [{"acceptLanguange": [], "JWT":[]}]
*/
masterDataRouter.post(
  '/master_ipvs/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('MasterIPV'),
  masterDataIPVXlsSchema,
  uploadXLS,
)

/**
 * Download list master Jumlah Pemberian XLS
 * @route GET /v2/master_data/master_target_distributions/xls
 * @group MasterData - Operations about MasterData
 * @param {string} keyword.query - Keyword - Nama
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
masterDataRouter.get('/master_target_distributions/xls',
  parameterModel.custom('MasterTargetDistribution', masterTargetDistributionList),
  downloadData)

/**
* Get list master Jumlah Pemberian
* @route GET /v2/master_data/master_target_distributions
* @group MasterData - Operations about MasterData
* @param {integer} page.query - Page - 1
* @param {integer} paginate.query - Paginate - 10
* @param {string} keyword.query - Keyword - Nama
* @returns {object} 200 -
* @returns {Error}  default - Unexpected error
* @security [{"acceptLanguange": [], "JWT":[]}]
*/
masterDataRouter.get('/master_target_distributions',
  parameterModel.custom('MasterTargetDistribution', masterTargetDistributionList),
  list)

/* GET template xls. */
/**
* Get XLS Template Master Jumlah Pemberian
* @route GET /xls/template/master_target_distributions_v2
* @group MasterData - Operations about MasterData
* @returns {object} 200 - {
* "message": "Success menghapus data"
* }
* @returns {object} 404 - {
*   "error": "Data not found"
* }
* @returns {Error} default 500 - { message: "Internal server error" }
* @security [{"acceptLanguange": [], "JWT":[]}]
*/

/* POST master_target_distributions xls. */
/**
* Upload Master Jumlah Pemberian
* @route POST /v2/master_data/master_target_distributions/xls
* @group MasterData - Operations about MasterData
* @param {file} file.formData.required - File XLS - Master target distribution
* @returns {object} 200 - {
*    "message": "Success menghapus data"
* }
* @returns {object} 404 - {
*   "error": "Data not found"
* }
* @returns {Error} default 500 - { message: "Internal server error" }
* @security [{"acceptLanguange": [], "JWT":[]}]
*/
masterDataRouter.post(
  '/master_target_distributions/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('MasterTargetDistribution'),
  masterDataDistributionXlsSchema,
  uploadXLS,
)

export default masterDataRouter
