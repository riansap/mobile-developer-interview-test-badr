import express from 'express'
import parameterModel from '../helpers/parameterModel'
import * as commonController from '../controllers/commonController'
import * as batchController from '../controllers/batchController'
import { getDataDelete, getDataDummy, runDeleteBiofarma } from '../controllers/biofarmaOrderController'
import { list } from '../controllers/commonController'

const biofarmaDeleteRouter = express.Router()

/* GET batch detail. */
/**
 * This function comment is parsed by doctrine
 * @route GET /batch/{id}
 * @group Batch - Operations about batch
 * @param {id} id.path - id batch
 * @returns {object} 201 - {
 *   "id": 1,
 *   "code": "ABC123",
 *   "expired_date": "date",
 *   "production_date": "date"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"JWT":[]}]
 */
biofarmaDeleteRouter.get(
  '/data-delete',
  parameterModel.custom('DeleteBiofarma', getDataDelete),
  list
)
biofarmaDeleteRouter.get('/dummy',
  parameterModel.custom('DummyBiofarma', getDataDummy),
  list
)
biofarmaDeleteRouter.post(
  '/run',
  runDeleteBiofarma
)

export default biofarmaDeleteRouter
