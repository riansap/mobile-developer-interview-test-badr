import express from 'express'
import parameterModel from '../helpers/parameterModel'
import * as coldchainCapacityEquipmentController from '../controllers/coldchainCapacityEquipmentController'
import { validate } from '../validators'
import { createValidator, updateValidator, defaultID } from '../validators/coldchainCapacityEquipmentValidator'

const cceRouter = express.Router()

cceRouter.post(
  '/',
  validate(createValidator),
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  coldchainCapacityEquipmentController.create
)

cceRouter.put(
  '/:id/inactive',
  validate(defaultID),
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  parameterModel.clearAndAddBody({ status: false }),
  coldchainCapacityEquipmentController.update
)

cceRouter.put(
  '/:id/active',
  validate(defaultID),
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  parameterModel.clearAndAddBody({ status: true }),
  coldchainCapacityEquipmentController.update
)

cceRouter.put(
  '/:id',
  validate(updateValidator),
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  coldchainCapacityEquipmentController.update
)

cceRouter.get(
  '/',
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  coldchainCapacityEquipmentController.filter,
  coldchainCapacityEquipmentController.list
)

cceRouter.get(
  '/xls',
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  coldchainCapacityEquipmentController.filter,
  coldchainCapacityEquipmentController.exportXls
)

cceRouter.get(
  '/:id',
  validate(defaultID),
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  coldchainCapacityEquipmentController.detail
)

cceRouter.delete(
  '/:id',
  validate(defaultID),
  parameterModel.define('ColdchainCapacityEquipmentIot'),
  coldchainCapacityEquipmentController.destroy
)

export default cceRouter
