import express from 'express'
import * as volumeMaterialController from '../controllers/volumeMaterialController'
import { validate } from '../validators'
import * as volumeMaterialValidator from '../validators/volumeMaterialValidator'

const volumeMaterialRouter = express.Router()

volumeMaterialRouter.get('/:id', validate(volumeMaterialValidator.detail), volumeMaterialController.detail)

volumeMaterialRouter.post('/', validate(volumeMaterialValidator.create), volumeMaterialController.create)
volumeMaterialRouter.put('/:id', validate(volumeMaterialValidator.update), volumeMaterialController.update)
volumeMaterialRouter.delete('/:id', volumeMaterialController.destroy)

export default volumeMaterialRouter

