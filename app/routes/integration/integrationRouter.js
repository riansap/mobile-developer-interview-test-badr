import express from 'express'
import rateLimit from 'express-rate-limit'

import { isAuthenticate } from '../../middlewares/authMiddleware'

import ayoSehatRouter from './ayoSehatRouter'
import emonevRouter from './emonevRouter'

import * as ayoSehatController from '../../controllers/integration/ayoSehatController'
import * as entityController from '../../controllers/entityController'
import {
  list,
} from '../../controllers/commonController'

import parameterModel from '../../helpers/parameterModel'

import { limitterOptions } from '../../helpers/services/rateLimiterHelper'

const integrationRouter = express.Router()
const integrationRouteLimit = rateLimit(limitterOptions)

integrationRouter.get('/ayo-sehat/entities',
  isAuthenticate,
  (req, res, next) => {
    req.query.exists_ayo_sehat = true
    next()
  },
  parameterModel.custom('Entity', entityController.list),
  list,
)
integrationRouter.get('/ayo-sehat/consumption/:customer_id?',
  isAuthenticate,
  parameterModel.custom('IntegrationAyoSehat', ayoSehatController.list),
  list,
)

integrationRouter.get('/ayo-sehat/export/consumption/',
  ayoSehatController.setWorkbook(),
  ayoSehatController.exportCSVList)

integrationRouter.use('/ayo-sehat', isAuthenticate, ayoSehatRouter)
integrationRouter.use('/emonev', isAuthenticate, emonevRouter)

export default integrationRouter
