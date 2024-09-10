import express from 'express'
import * as dataController from '../../controllers/v2/dataController'
import * as entityMaterialController from '../../controllers/v2/entityMaterialController'
import parameterModel from '../../helpers/parameterModel'
//import {list} from '../../controllers/commonController'
const dataRouter = express.Router()

/**
 * GET data offline.
 * @route GET /v2/data/app-data
 * @group Data v2 - Operations about data v2
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
// dataController
dataRouter.get(
  '/app-data',
  dataController.appData
)

/**
 * GET data material per entity offline.
 * @route GET /v2/data/material-entity
 * @group Data v2 - Operations about data v2
 * @param {integer} entity_id.query - Entity ID
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
dataRouter.get(
  '/material-entity/',
  parameterModel.custom('EntityMasterMaterialActivities', entityMaterialController.list),
  entityMaterialController.listResponseEntity
)

dataRouter.get('/app-notif', dataController.appNotif)

export default dataRouter