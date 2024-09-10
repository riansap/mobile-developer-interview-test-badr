import express from 'express'

import { list, detail, update } from '../controllers/commonController'
import { uploadXLS, downloadData } from '../controllers/excelController'
import {
  masterIPVList,
  masterTargetList,
  masterTargetDistributionList,
  masterTargetRegencyList,
  masterTargetRegencyData,
} from '../controllers/masterDataController'
import { workbookTargetRegency } from '../helpers/xls/excelTemplate'
import {
  masterDataDistributionXlsSchema,
  masterDataIPVXlsSchema,
  masterDataRegencyXlsSchema,
  masterDataTargetXlsSchema,
} from '../helpers/xls/xlsValidationSchema'
import parameterModel from '../helpers/parameterModel'

import * as xlsValidator from '../validators/xlsValidator'
import { validate } from '../validators'

import { hasRole } from '../middlewares/authMiddleware'
import uploadFile from '../middlewares/upload'

const masterDataRouter = express.Router()

/**
 * Download list master IPVs XLS
 * @route GET /master_data/master_ipvs/xls
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
 * @route GET /master_data/master_ipvs
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
 * Get XLS Template Master IPV
 * @route GET /xls/template/master_ipvs
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
* @route POST /master_data/master_ipvs/xls
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
 * Download list master Target XLS
 * @route GET /master_data/master_targets/xls
 * @group MasterData - Operations about MasterData
 * @param {string} keyword.query - Keyword - Nama
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
masterDataRouter.get('/master_targets/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('MasterTarget', masterTargetList),
  downloadData)

/**
* Get list master targets
* @route GET /master_data/master_targets
* @group MasterData - Operations about MasterData
* @param {integer} page.query - Page - 1
* @param {integer} paginate.query - Paginate - 10
* @param {string} keyword.query - Keyword - Nama
* @returns {object} 200 -
* @returns {Error}  default - Unexpected error
* @security [{"acceptLanguange": [], "JWT":[]}]
*/
masterDataRouter.get('/master_targets',
  parameterModel.custom('MasterTarget', masterTargetList),
  list)

/* GET template xls. */
/**
 * Get XLS Template Master Target
 * @route GET /xls/template/master_targets
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

/* POST master_targets xls. */
/**
* Upload master_targets
* @route POST /master_data/master_targets/xls
* @group MasterData - Operations about MasterData
* @param {file} file.formData.required - File XLS - Master target
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
  '/master_targets/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('MasterTarget'),
  masterDataTargetXlsSchema,
  uploadXLS,
)

/**
* Get detail master targets
* @route GET /master_data/master_target/{id}
* @group MasterData - Operations about MasterData
* @param {id} id.path - id target
* @returns {MasterTarget.model} 200 -
* @returns {Error}  default - Unexpected error
* @security [{"acceptLanguange": [], "JWT":[]}]
*/
masterDataRouter.get('/master_target/:id',
  parameterModel.define('MasterTarget'),
  detail)

// MasterTarget
/**
 * @typedef MasterTarget
 * @property {string} name.required - target name - eg:target
 * @property {string} created_at - created_at(nullable) - eg:2021-02-31
 * @property {string} updated_at - updated_at(nullable) - eg:2021-02-31
 */
/**
* Get detail master targets
* @route PUT /master_data/master_target/{id}
* @group MasterData - Operations about MasterData
* @param {id} id.path - id target
* @param {MasterTarget.model} data.body Update - user
* @returns {MasterTarget.model} 200 -
* @returns {Error}  default - Unexpected error
* @security [{"acceptLanguange": [], "JWT":[]}]
*/
masterDataRouter.put('/master_target/:id',
  parameterModel.define('MasterTarget'),
  update)

/**
 * Download list master Jumlah Pemberian XLS
 * @route GET /master_data/master_target_distributions/xls
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
* @route GET /master_data/master_target_distributions
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
 * @route GET /xls/template/master_target_distributions
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
* @route POST /master_data/master_target_distributions/xls
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

/**
 * Download list master data Sasaran XLS
 * @route GET /master_data/master_target_regencies/xls
 * @group MasterData - Operations about MasterData
 * @param {integer} year.query - Year - 2021
 * @param {integer} province_id.query - Province ID - 1
 * @param {integer} regency_id.query - Regency ID - 1
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
masterDataRouter.get('/master_target_regencies/xls',
  parameterModel.custom('MasterTargetRegency', masterTargetRegencyList),
  (req, res, next) => {
    req.workbook = workbookTargetRegency
    req.xlsFilename = `Master Data Sasaran Pusdatin ${Date()}`
    next()
  },
  downloadData)

/**
* Get list master data Sasaran Pusdatin
* @route GET /master_data/master_target_regencies
* @group MasterData - Operations about MasterData
* @param {integer} page.query - Page - 1
* @param {integer} paginate.query - Paginate - 10
* @param {integer} year.query - Year - 2021
* @param {integer} province_id.query - Province ID - 1
* @param {integer} regency_id.query - Regency ID - 1
* @returns {object} 200 -
* @returns {Error}  default - Unexpected error
* @security [{"acceptLanguange": [], "JWT":[]}]
*/
masterDataRouter.get('/master_target_regencies',
  masterTargetRegencyList,
  masterTargetRegencyData)

/* GET template xls. */
/**
 * Get XLS Template Master data Sasaran
 * @route GET /xls/template/master_target_regencies
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

/* POST master_target_regencies xls. */
/**
* Upload master data Sasaran
* @route POST /master_data/master_target_regencies/xls
* @group MasterData - Operations about MasterData
* @param {file} file.formData.required - File XLS - Master target distribution
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
  '/master_target_regencies/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('MasterTargetRegency'),
  masterDataRegencyXlsSchema,
  uploadXLS,
)

export default masterDataRouter
