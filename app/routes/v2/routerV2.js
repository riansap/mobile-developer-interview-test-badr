import express from 'express'

import { validate } from '../../validators'
import {
  hasRole,
  isAuthenticate,
  notHasRole,
} from '../../middlewares/authMiddleware'
import { filterKeywordBy, list } from '../../controllers/commonController'

import parameterModel from '../../helpers/parameterModel'

import masterActivityRouter from './masterActivityRouter'
import dataRouter from './dataRouter'
import materialRouter from './materialRouter'
import stockRouter from './stockRouter'
import orderNormalRouter from './order/orderNormalRouter'
import yearlyPlanRouter from './yearlyPlanRouter'
import entityMaterialRouter from './entityMaterialRouter'
import integrationRouter from './integration/integrationRouter'

import * as transactionController from '../../controllers/v2/transaction/transactionController'
import * as transactionXLSController from '../../controllers/v2/transaction/transactionXLSController'
import * as listTransactionController from '../../controllers/v2/transaction/listTransactionController'
import * as listTransactionOptimizeController from '../../controllers/v2/transaction/listTransactionOptimizeController'
import * as stockController from '../../controllers/v2/stock/stockController'
import * as stockWastageController from '../../controllers/v2/stock/stockWastageController'
import * as materialController from '../../controllers/v2/materialController'
import * as orderListController from '../../controllers/v2/order/orderListController'
import * as orderListOptimizeController from '../../controllers/v2/order/orderListOptimizeController'
import * as activityController from '../../controllers/v2/masterActivityController'
import * as manufactureController from '../../controllers/v2/manufactureController'

import { downloadData } from '../../controllers/excelController'

import * as transactionValidator from '../../validators/v2/transactionValidator'
import { checkBiofarmaOrder, createBiofarmaSMDVOrders } from '../../controllers/biofarmaOrderController'
import transactionRouter from './transactionRouter'
import masterDataRouter from './masterDataRouter'
import { cacheUrl } from '../../middlewares/redisMiddleware'
import exterminationRouter from './exterminationRouter'

import { createDinOrder } from '../../controllers/dinOrderController'
import dashboardSatusehatRouter from './dashboardSatusehat'
import { validateFreezeTransactions } from '../../middlewares/maintenanceMiddleware'
import { createEdStockNotif, createGreatLessStockNotif, createNotifBatchPerEntity, createNotifRabiesVaccine, createOrderNotifNotReceive } from '../../controllers/cronNotificationController'

import {changeBatchToNotActive, changeBatchInactiveToActive} from '../../controllers/cronBatchController'

const routerV2 = express.Router()

routerV2.get(
  '/manufactures',
  isAuthenticate,
  parameterModel.custom('Manufacture', manufactureController.list),
  list
)

routerV2.get(
  '/master-activities',
  isAuthenticate,
  // cacheUrl,
  parameterModel.custom('MasterActivity', activityController.customList),
  list
)

routerV2.get(
  '/master-activities/xls',
  isAuthenticate,
  parameterModel.custom('MasterActivity', activityController.list),
  downloadData
)

routerV2.get(
  '/stocks',
  isAuthenticate,
  stockController.filter,
  stockController.customList,
  list
)

routerV2.get(
  '/stocks/logistic',
  isAuthenticate,
  stockController.logisticFilter,
  stockController.logisticList
)

routerV2.get(
  '/stocks-new',
  isAuthenticate,
  stockController.filter,
  stockController.customList2,
)

routerV2.get(
  '/stock-extermination',
  isAuthenticate,
  stockWastageController.filter,
  stockWastageController.customList,
  list
)

routerV2.get(
  '/stock-extermination/xls',
  isAuthenticate,
  stockWastageController.filter,
  stockWastageController.formatXLS,
  downloadData
)

routerV2.get(
  '/materials',
  isAuthenticate,
  // cacheUrl,
  parameterModel.custom('MasterMaterial', materialController.list),
  //filterKeywordBy(['name']),
  list
)

routerV2.get(
  '/materials/biofarma',
  isAuthenticate,
  materialController.materialBiofarma
)

routerV2.get(
  '/transactions',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  listTransactionController.filter,
  listTransactionController.customList
)

routerV2.get(
  '/transactions-discard',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  listTransactionController.filter,
  listTransactionController.customList
)

routerV2.get(
  '/transactions/optimize',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  listTransactionOptimizeController.filter,
  listTransactionOptimizeController.customList
)

routerV2.get(
  '/transactions/deleted',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  (req, res, next) => {
    req.is_deleted = 1
    next()
  },
  listTransactionController.filter,
  listTransactionController.customList
)

routerV2.post(
  '/transactions',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  validateFreezeTransactions,
  transactionValidator.interceptTransactionValue,
  validate(transactionValidator.create),
  transactionController.submit
)

routerV2.post(
  '/transactions/dummy',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  validate(transactionValidator.createDummy),
  transactionController.submitDummy
)

routerV2.post(
  '/transactions/canceldiscard',
  isAuthenticate,
  validate(transactionValidator.cancelDiscard),
  transactionController.cancelDiscard
)

routerV2.get(
  '/orders',
  isAuthenticate,
  parameterModel.custom('Order', orderListController.list),
  list
)

routerV2.get(
  '/orders/optimize',
  isAuthenticate,
  orderListOptimizeController.filter,
  orderListOptimizeController.customList
)

routerV2.get('/orders/status', isAuthenticate, orderListController.listStatus)

routerV2.get(
  '/transactions/xls',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  listTransactionController.filter,
  listTransactionController.exportExcel
)

routerV2.get(
  '/transactions/xls/optimize',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  listTransactionOptimizeController.filter,
  listTransactionOptimizeController.exportExcel
)

routerV2.get(
  '/transactions/logistik/xls',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  listTransactionController.filter,
  (req, res, next) => {
    req.logistik = true
    next()
  },
  listTransactionController.exportExcel
)

routerV2.get(
  '/transactions/all-entity/xls',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN', 'MANAGER', 'MANAGER_COVID']),
  transactionXLSController.exportExcelAllEntity
)

routerV2.get(
  '/orders/xls',
  isAuthenticate,
  orderListController.list,
  parameterModel.custom('OrderItem', orderListController.formatOrderXLSQuery),
  downloadData
)

routerV2.get(
  '/orders/xls/optimize',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  orderListOptimizeController.filter,
  orderListOptimizeController.formatOrderXLSQuery
)

routerV2.get(
  '/stocks/xls',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  stockController.filter,
  parameterModel.custom('Stock', stockController.formatStockXLSQuery),
  downloadData
)

routerV2.get('/job/biofarma', async (req, res, next) => {
  try {
    let { startDate, endDate } = req.query
    await checkBiofarmaOrder({
      filterDate: {
        start_date: startDate,
        end_date: endDate,
      },
      isV2: true,
    })
    res.json({ data: 'success' })
  } catch (err) {
    console.log(err)
    next(err)
  }
})

routerV2.get('/job/biofarma-smdv', async (req, res)=>{
  let { startDate = null, endDate=null } = req.query

  const resultBiofarma = await createBiofarmaSMDVOrders({start_date: startDate, end_date: endDate})
  if(resultBiofarma) return res.status(200).json(resultBiofarma)
  else return res.status(400).json({message : 'Failed to insert data'})
})

routerV2.get('/job/great-less-stock', async (req, res, next) => {
  try {
    const { entity_id = null } = req.query
    const data = await createGreatLessStockNotif(entity_id)
    return res.json(data)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

routerV2.get('/job/batch-notif-per-entity', async (req, res, next) => {
  try {
    const data = await createNotifBatchPerEntity()
    return res.json(data)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

routerV2.get('/job/ed-stock-notif', async (req, res, next) => {
  try {
    const { entity_id = null } = req.query
    const data = await createEdStockNotif(entity_id)
    return res.json(data)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

routerV2.get('/job/order-not-receive-notif', async (req, res, next) => {
  try {
    const { entity_id = null } = req.query
    const data = await createOrderNotifNotReceive(entity_id)
    return res.json(data)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

routerV2.get('/job/vaccine-remind-notif', async (req, res, next) => {
  try {
    const { entity_id = null } = req.query
    const data = await createNotifRabiesVaccine(entity_id)
    return res.json(data)
  } catch (err) {
    console.log(err)
    next(err)
  }
})

routerV2.get('/job/din', async (req, res, next) => {
  try {
    let { startDate, endDate } = req.query
    let resultError = await createDinOrder({
      start_date: startDate,
      end_date: endDate,
    })
    if (resultError.length > 0) return res.status(400).json(resultError)
    else return res.json({ data: 'success' })
  } catch (err) {
    console.log(err)
    next(err)
  }
})

routerV2.get('/job/batches', async(req, res, next)=>{
  try{
    const {inactive_to_active} = req.query
    let result = {message : 'Not running'}
    if(inactive_to_active)
      result = await changeBatchInactiveToActive()
    else
      result = await changeBatchToNotActive() 
    return res.json(result)
  }catch(err){
    console.error(err)
    next(err)
  }
})

routerV2.use('/master-activity', isAuthenticate, masterActivityRouter)
routerV2.use('/data', isAuthenticate, dataRouter)
routerV2.use('/material', isAuthenticate, materialRouter)
routerV2.use('/stock', isAuthenticate, stockRouter)
routerV2.use('/order', isAuthenticate, orderNormalRouter)
routerV2.use('/transaction', isAuthenticate, transactionRouter)
routerV2.use('/yearly-plan', isAuthenticate, yearlyPlanRouter)
routerV2.use('/master_data', isAuthenticate, masterDataRouter)
routerV2.use('/extermination', isAuthenticate, exterminationRouter)
routerV2.use('/material-entity', isAuthenticate, entityMaterialRouter)
routerV2.use('/integration', isAuthenticate, integrationRouter)
routerV2.use('/dashboard-satusehat', isAuthenticate, dashboardSatusehatRouter)

export default routerV2
