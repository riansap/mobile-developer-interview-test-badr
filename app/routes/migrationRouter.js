import express from 'express'
import * as migrationController from '../controllers/migrationController'
// import * as commonController from '../controllers/commonController'
// import * as orderStatusController from '../controllers/orderStatusController'
// import parameterModel from '../helpers/parameterModel'
// import { validate } from '../validators'
// import * as orderValidator from '../validators/orderValidator'
// import * as orderStatusValidator from '../validators/orderStatusValidator'
// import { ORDER_STATUS } from '../helpers/constants'

const migrationRouter = express.Router()

migrationRouter.get('/user', migrationController.user)
migrationRouter.get('/entity', migrationController.entity)
migrationRouter.get('/inventory', migrationController.inventory)
migrationRouter.get('/transaction', migrationController.transaction)

export default migrationRouter