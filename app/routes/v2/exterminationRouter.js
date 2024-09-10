import express from 'express'
import { isAuthenticate, notHasRole } from '../../middlewares/authMiddleware'
import * as exterminationController from '../../controllers/v2/extermination/exterminationController'
import * as exterminationIndependentController from '../../controllers/v2/extermination/exterminationIndependentController'
import * as exterminationValidators from '../../validators/v2/exterminationValidator'
import parameterModel from '../../helpers/parameterModel'
import * as exterminationOrderListController from '../../controllers/v2/extermination/exterminationOrderListController'
import { list } from '../../controllers/commonController'
import { validate } from '../../validators'
import { downloadData } from '../../controllers/excelController'
import { validateFreezeTransactions } from '../../middlewares/maintenanceMiddleware'

const exterminationRouter = express.Router()

exterminationRouter.post('/shipment',
  notHasRole(['ADMIN']),
  validateFreezeTransactions,
  validate(exterminationValidators.ship),
  exterminationController.ship
)

exterminationRouter.get('/orders',
  isAuthenticate,
  parameterModel
    .custom('Order', exterminationOrderListController.list),
  list
)

exterminationRouter.get('/orders/xls',
  isAuthenticate,
  exterminationOrderListController.list,
  parameterModel
    .custom('OrderItem', exterminationOrderListController.formatOrderXLSQuery),
  downloadData
)

exterminationRouter.get('/orders/status',
  exterminationOrderListController.listStatus
)

exterminationRouter.get('/orders/:id',
  exterminationOrderListController.detail
)

exterminationRouter.get('/orders/:id/download',
  exterminationOrderListController.detailDownload
)

exterminationRouter.put(
  '/orders/:id/fulfill',
  validateFreezeTransactions,
  validate(exterminationValidators.fulfill),
  exterminationController.fulfill,
)

exterminationRouter.put(
  '/orders/:id/cancel',
  validateFreezeTransactions,
  exterminationController.cancel,
)

exterminationRouter.post('/independent',
  notHasRole(['ADMIN']),
  validateFreezeTransactions,
  validate(exterminationValidators.independent),
  exterminationIndependentController.independent
)

exterminationRouter.get('/independent',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  exterminationIndependentController.filter,
  exterminationIndependentController.customList
)

exterminationRouter.get('/independent/xls',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  exterminationIndependentController.filter,
  exterminationIndependentController.formatXLS,
  downloadData
)

exterminationRouter.get('/type',
  parameterModel.define('ExterminationTransactionType'),
  list
)

exterminationRouter.get('/flow',
  parameterModel.define('ExterminationFlow'),
  list
)

exterminationRouter.get('/flow/reason',
  parameterModel.define('ExterminationFlowReason'),
  list
)

export default exterminationRouter
