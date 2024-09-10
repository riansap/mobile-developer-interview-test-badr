import express from 'express'
import { hasRole } from '../middlewares/authMiddleware'
import * as configController from '../controllers/configController'
import { cacheUrl } from '../middlewares/redisMiddleware'
import { CONFIGURATIONS } from '../helpers/config'

const configRouter = express.Router()

configRouter.put(
  '/freeze-transactions',
  hasRole(['ADMIN_SO']),
  (req, res, next) => {
    req.cacheKey = CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.cacheKey
    req.refreshCache = true
    cacheUrl(req, res, next)
  },
  configController.freezeTransactions,
)

configRouter.get(
  '/freeze-transactions',
  hasRole(['ADMIN_SO']),
  configController.freezeTransactionsStatus,
)

export default configRouter
