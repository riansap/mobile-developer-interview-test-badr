import express from 'express'
import * as materialEntityValidator from '../../validators/v2/entityMasterMaterialValidator'
import * as entityMaterialController from '../../controllers/v2/entityMaterialController'
import { validate } from '../../validators'

const entityMaterialRouter = express.Router()

/**
 * GET data offline.
 * @route GET /v2/data/app-data
 * @group Data v2 - Operations about data v2
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
// update entityMasterMaterialActivities

entityMaterialRouter.put('/:id',
  validate(materialEntityValidator.updateEntityMasterMaterialActivities),
  entityMaterialController.update
)

entityMaterialRouter.post('/',
  validate(materialEntityValidator.createEntityMasterMaterialActivities),
  entityMaterialController.create
)

entityMaterialRouter.delete('/:id',
  validate(materialEntityValidator.destroyEntityMaterialActivities),
  entityMaterialController.destroy
)

export default entityMaterialRouter