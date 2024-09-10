import express from 'express'
import * as dataController from '../controllers/dataController'

const dataRouter = express.Router()

/* GET data offline. */
/**
 * This function comment is parsed by doctrine
 * @route GET /data/app-data
 * @group Data - Operations about data
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
// dataController
dataRouter.get(
  '/app-data',
  dataController.appData
)

/* GET data material per entity offline. */
/**
 * This function comment is parsed by doctrine
 * @route GET /data/material-entity
 * @group Data - Operations about data
 * @param {integer} entity_id.query - Entity ID
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
dataRouter.get(
  '/material-entity/',
  dataController.dataPerEntity
)

export default dataRouter