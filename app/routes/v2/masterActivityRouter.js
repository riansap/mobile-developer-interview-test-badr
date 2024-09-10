import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import * as commonController from '../../controllers/commonController'
import * as activityValidator from '../../validators/v2/activityValidator'
import { validate } from '../../validators'
import * as xlsValidator from '../../validators/xlsValidator'

import {
  activityXlsSchema
} from '../../helpers/xls/xlsValidationSchema'

import { uploadXLS} from '../../controllers/excelController'
import uploadFile from '../../middlewares/upload'
import {hasRole} from '../../middlewares/authMiddleware'

const masterActivityRouter = express.Router()

/**
 * GET activity listing
 * @route GET /v2/master-activities
 * @group MasterActivity - Operations about master activity
 * @param {string} keyword.query - name master activity
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

/**
 * GET activity detail
 * @route GET /v2/master-activity/{id}
 * @group MasterActivity - Operations about master activity
 * @param {id} id.path - id master activity
 * @returns {object} 201 - {}
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */

masterActivityRouter.get(
  '/:id',
  parameterModel.define('MasterActivity'),
  commonController.detail
)

masterActivityRouter.post(
  '/',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(activityValidator.create),
  parameterModel.define('MasterActivity'),
  commonController.create
)



masterActivityRouter.post(
  '/xls',
  hasRole(['ADMIN', 'SUPERADMIN']),
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('MasterActivity'),
  activityXlsSchema,
  uploadXLS,
)

masterActivityRouter.put(
  '/:id',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(activityValidator.update),
  parameterModel.define('MasterActivity'),
  commonController.update
)

masterActivityRouter.delete(
  '/:id',
  hasRole(['ADMIN', 'SUPERADMIN']),
  validate(activityValidator.destroy),
  parameterModel.define('MasterActivity'),
  commonController.destroy
)

export default masterActivityRouter
