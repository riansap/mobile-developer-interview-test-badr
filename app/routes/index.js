import express from 'express'
import { body } from 'express-validator'
import usersRouter from './userRouter'
import entitiesRouter from './entityRouter'
import materialRouter from './materialRouter'
import materialEntityRouter from './materialEntityRouter'
import batchRouter from './batchRouter'
import dataRouter from './dataRouter'
import materialTagRouter from './materialTagRouter'
import migrationRouter from './migrationRouter'
import yearlyPlanRouter from './yearlyPlanRouter'
import notifRouter from './notifRouter'
import biofarmaDeleteRouter from './biofarmaDeleteRouter'

import {
  list, filterKeywordBy, filterQuery, versionMobile, filterKeywordQuery, listDeleted
} from '../controllers/commonController'
import * as batchController from '../controllers/batchController'
import * as stockController from '../controllers/stockController'
import * as transactionController from '../controllers/transactionController'
import * as materialEntityController from '../controllers/materialEntityController'
import * as materialController from '../controllers/materialController'
import * as orderController from '../controllers/orderController'
import * as orderStatusController from '../controllers/orderStatusController'
import * as orderStockController from '../controllers/orderStockController'
import * as materialTagController from '../controllers/materialTagController'
import * as userController from '../controllers/userController'
import * as trackDeviceController from '../controllers/trackDeviceController'
import * as jobController from '../controllers/jobController'
import * as locationController from '../controllers/locationController'
import { checkBiofarmaOrder } from '../controllers/biofarmaOrderController'
import * as notifController from '../controllers/notificationController'
import { testIntegrationTransactionBPOM } from '../controllers/bpom/bpomController'
import * as insertData from '../controllers/insertDataController'

import * as orderValidator from '../validators/orderValidator'
import * as xlsValidator from '../validators/xlsValidator'

import parameterModel from '../helpers/parameterModel'
import transactionTypeRouter from './transactionTypeRouter'
import transactionReasonRouter from './transactionReasonRouter'
import stockRouter from './stock/stockRouter'
import transactionRouter from './transactionRouter'
import {orderRouter, orderRouterIOT } from './orderRouter'
import manufactureRouter from './manufactureRouter'
import requestOrderRouter from './requestOrderRouter'
import masterDataRouter from './masterDataRouter'
import coldstorageRouter from './coldstorageRouter'
import volumeMaterialRouter from './volumeMaterialRouter'
import configRouter from './configRouter'
import coldchainCapacityEquipmentRouter from './coldchainCapacityEquipmentRouter'

import * as coldstorageController from '../controllers/coldstorageController'
import * as volumeMaterialController from '../controllers/volumeMaterialController'

import {
  userXlsSchema, entityXlsSchema, materialXlsSchema, manufactureXlsSchema, volumeMaterialXlsSchema,
  materialKfaRelationXlsSchema
} from '../helpers/xls/xlsValidationSchema'
import { isAuthenticate, hasRole, notHasRole } from '../middlewares/authMiddleware'
import uploadFile from '../middlewares/upload'

import { validate } from '../validators'
import * as transactionValidator from '../validators/transactionValidator'
import * as manufactureController from '../controllers/manufactureController'
import * as entityController from '../controllers/entityController'
import { uploadXLS, downloadTemplate, downloadData } from '../controllers/excelController'

import routerV2 from './v2/routerV2'
import routerIntegration from './integration/integrationRouter'
import { cacheUrl } from '../middlewares/redisMiddleware'
import { Op } from 'sequelize'

import * as dinOrderController from '../controllers/dinOrderController'

import * as coldstorageAnnualPlan from '../controllers/coldstorageAnnualPlanController'
import { materialKfaUpdateRelationXls } from '../controllers/v2/materialController'

const router = express.Router()

/* GET home page. */
router.get('/', (req, res) => res.send({}))
router.get('/maintenance', (req, res) => res.status(422).json({ message: req.__('maintenance') }))

router.get(
  '/xls/template/:filename',
  isAuthenticate,
  downloadTemplate,
)

router.post(
  '/version',
  validate([
    body('version')
      .isNumeric()
      .withMessage((value, { req }) => req.__('validator.number', {
        field: req.__('version'),
      })),
    body('os')
      .isString()
      .withMessage((value, { req }) => req.__('validator.number', {
        field: req.__('version'),
      })),
  ]),
  versionMobile,
)

router.get('/users/xls',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('User', userController.list),
  downloadData)

router.get('/users',
  isAuthenticate,
  // filterKeywordBy(['username', 'firstname', 'lastname', 'mobile_phone']),
  parameterModel.custom('User', userController.list),
  list)

router.post(
  '/users/xls',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('User'),
  userXlsSchema,
  uploadXLS,
)

router.get('/entities/xls',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('Entity', entityController.list),
  downloadData)

router.get('/entities/deleted',
  isAuthenticate,
  cacheUrl,
  parameterModel.custom('Entity', entityController.list),
  listDeleted)

router.get('/entities',
  isAuthenticate,
  cacheUrl,
  parameterModel.custom('Entity', entityController.list),
  list)

router.post(
  '/entities/xls',
  isAuthenticate,
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('Entity'),
  entityXlsSchema,
  uploadXLS,
)

/* GET entity-tags listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /entity-tags
 * @group Entity Tag - Operations about entity
 * @param {string} keyword.query - Title entitas Tag
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "title": "Dinas Kesehatan"}]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

router.get('/entity-tags',
  isAuthenticate,
  cacheUrl,
  filterKeywordBy(['title']),
  parameterModel.define('EntityTag'),
  // function(req, res, next){
  //   req.mappingDocs =  ({ docs }) => docs.map((data) => {
  //     // data.title = res.__(`tags.${data.id}`)

  //     return data
  //   })
  //   next()
  // },
  list)

router.get('/materials',
  isAuthenticate,
  // cacheUrl,
  parameterModel.custom('Material', materialController.list),
  list)

router.get('/materials/xls',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('MasterMaterial', materialController.listV2),
  downloadData)

router.post(
  '/materials/xls',
  isAuthenticate,
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('MasterMaterial'),
  materialXlsSchema,
  uploadXLS,
)

router.post(
  '/materials/kfa-relation/xls',
  isAuthenticate,
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  materialKfaRelationXlsSchema,
  materialKfaUpdateRelationXls,
)

router.get('/material-entities',
  isAuthenticate,
  parameterModel.custom('MaterialEntity', materialEntityController.list),
  list)

router.get('/transaction-types',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  filterKeywordBy(['title']),
  parameterModel
    .define('TransactionType'),
  list)

router.get('/transaction-reasons',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  filterKeywordQuery('like', ['title']),
  filterKeywordQuery('eq', ['transaction_type_id']),
  parameterModel
    .define('TransactionReason'),
  list)

router.get('/transactions',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  parameterModel
    .custom('Transaction', transactionController.list),
  transactionController.customList)

router.get('/transactions/covid-detail',
  isAuthenticate,
  parameterModel
    .custom('Transaction', transactionController.list),
  (req, res, next) => {
    req.order = [
      ['customer_id', 'desc'],
      ['updatedAt', 'asc'],
    ]
    next()
  },
  list)

router.get('/transactions/xls',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  parameterModel
    .custom('Transaction', transactionController.list),
  transactionController.exportExcel)

router.get('/transactions/all-entity/xls',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN', 'MANAGER', 'MANAGER_COVID']),
  transactionController.exportExcelAllEntity)

router.get('/batches',
  isAuthenticate,
  parameterModel
    .custom('Batch', batchController.list),
  list)

router.get('/material-tags',
  isAuthenticate,
  parameterModel
    .custom('MaterialTag', materialTagController.list),
  list)
router.get(
  '/stocks',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  parameterModel
    .custom('MaterialEntity', stockController.list),
  stockController.customList,
)

router.get(
  '/stocks/xls',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  stockController.list,
  parameterModel.custom('Stock', stockController.exportStockExcel),
  downloadData,
)

router.post(
  '/transactions',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  validate(transactionValidator.create),
  transactionController.submit,
)

router.put(
  '/transactions/:id/injection',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  validate(transactionValidator.injection),
  transactionController.updateDose
)

router.post(
  '/transactions/integration-bpom',
  isAuthenticate,
  hasRole(['SUPERADMIN']),
  testIntegrationTransactionBPOM,
)

router.get(
  '/manufactures',
  isAuthenticate,
  parameterModel.custom('Manufacture', manufactureController.list),
  list,
)

router.get('/manufactures/xls',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('Manufacture', manufactureController.list),
  downloadData)

router.post(
  '/manufactures/xls',
  isAuthenticate,
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  parameterModel.define('Manufacture'),
  manufactureXlsSchema,
  uploadXLS,
)

/* GET order listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders/covid-distribution
 * @group Order - Operations about order
 * @param {integer} vendor_id.query - Vendor ID
 * @param {integer} customer_id.query - Customer ID
 * @param {string} order_id.query - order_id
 * @param {integer} status.query - status order
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @param {integer} paginate.query - paginate
 * @param {integer} page.query - page
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

router.get(
  '/orders/covid-distribution',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('Order', orderController.listOrderDistributionCovid),
  list,
)

/* GET order listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders/covid-receiption
 * @group Order - Operations about order
 * @param {integer} vendor_id.query - Vendor ID
 * @param {integer} customer_id.query - Customer ID
 * @param {integer} order_id.query - order_id
 * @param {integer} response_status.query - status receiption (200,400,404)
 * @param {string} from_date.query - from date (Y-m-d)
 * @param {string} to_date.query - to date (Y-m-d)
 * @param {integer} material_id.query - material_id
 * @param {integer} paginate.query - paginate
 * @param {integer} page.query - page
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

router.get(
  '/orders/covid-receiption',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  parameterModel.custom('OrderItem', orderController.listOrderReceiptionCovid),
  list,
)

/* GET order listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /orders/xls
 * @group Order - Operations about order
 * @param {integer} entityId.query - id entitas
 * @param {integer} vendorId.query - id vendor
 * @param {integer} customerId.query - id cutomer
 * @param {string} ordered_number.query - ordered number
 * @param {string} purchase_ref.query - purchase reference
 * @param {string} sales_ref.query - sales reference
 * @param {integer[]} tags.query - array string id tags
 * @param {integer} type.query - type order {NORMAL 1, DROPPING 2}
 * @param {string} purpose.query - [purchase, sales] string
 * @param {integer} status.query - status order
 * @param {string} from_date.query - from date
 * @param {string} to_date.query - to date
 * @param {integer} entity_city_id.query - entity city id
 * @param {integer} entity_puskesmas_id.query - entity puskesmas id
 * @param {integer} entity_tag_id.query - entity tag id
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

router.get(
  '/orders/xls',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  orderController.list,
  parameterModel.custom('OrderItem', orderController.exportOrderExcel),
  downloadData,
)

router.get(
  '/orders',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  validate(orderValidator.searchQuery),
  parameterModel.custom('Order', orderController.list),
  list,
)

router.get('/orders/status',
  isAuthenticate,
  orderStatusController.listStatus)

router.get(
  '/order-tags',
  isAuthenticate,
  parameterModel.define('OrderTag'),
  list,
)

/* GET provinces listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /provinces
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/provinces',
  isAuthenticate,
  cacheUrl,
  parameterModel.define('Province'),
  filterKeywordBy(['name']),
  list,
)

/* GET regencies listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /regencies
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {string} province_id.query - province ID - province ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/regencies',
  isAuthenticate,
  cacheUrl,
  parameterModel.custom('Regency', locationController.list),
  list,
)

/* GET subdistricts listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /subdistricts
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {string} regency_id.query - regency ID - regency ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/subdistricts',
  isAuthenticate,
  parameterModel.custom('SubDistrict', locationController.list),
  filterKeywordBy(['name']),
  list,
)

/* GET villages listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /villages
 * @group Region - Operations about region
 * @param {string} keyword.query - Nama - Keyword
 * @param {string} sub_district_id.query - subdistrict ID - subdistrict ID
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/villages',
  isAuthenticate,
  parameterModel.define('Village'),
  filterKeywordBy(['name']),
  filterQuery(['sub_district_id']),
  list,
)

/* GET timezones listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /timezones
 * @group Region - Operations about region
 * @param {string} keyword.query - Title - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/timezones',
  isAuthenticate,
  parameterModel.define('Timezone'),
  filterKeywordBy(['title']),
  list,
)
/* GET order stock listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /order-stocks
 * @group Order Stocks - Operations about order stocks
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {integer} customer_id.query - customer id - 1
 * @param {integer} vendor_id.query - vendor id - 1
 * @param {string} from.query - from - ex: YYYY-MM-DD
 * @param {string} to.query - to - ex: YYYY-MM-DD
 * @param {integer} material_tag_id.query - material_tag_id - 6 (covid)
 * @param {integer} material_id.query - material id
 * @param {integer} transaction_type_id.query - transaction type id
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/order-stocks',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  parameterModel.custom('OrderStock', orderStockController.list),
  list,
)

/* GET notifications listing. */
/**
 * GET notifications listing
 * @route GET /notifications
 * @group Notification - Operations about notification
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {integer} province_id.query - province_id - 1
 * @param {integer} regency_id.query - regency_id - 1
 * @param {string} created_at.query - created_at - ex: YYYY-MM-DD
 * @param {integer} entity_id.query - entity_id - 1
 * @param {string} entity_tag_ids.query - entity_tag_ids - 1
 * @param {string} type.query - type (ed-30, ed-mngr, order-deliv) - ed-30
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/notifications',
  isAuthenticate,
  (req, res, next) => {
    req.expire = 60
    req.withUser = true
    cacheUrl(req, res, next)
  },
  parameterModel.custom('Notification', notifController.list),
  list,
)

router.get(
  '/notifications/stop-notification-histories',
  isAuthenticate,
  parameterModel.custom('StopNotificationHistory', notifController.listStopHistories),
  list
)

router.get(
  '/stop-notification-reasons',
  isAuthenticate,
  parameterModel.define('StopNotificationReason'),
  list
)

/**
 * This function comment is parsed by doctrine
 * @route GET /track-devices
 * @group TrackDevice - Operations about TrackDevice
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {integer} province_id.query - Province ID
 * @param {integer} regency_id.query - Regency ID
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/track-devices',
  isAuthenticate,
  filterKeywordBy(['nopol']),
  parameterModel.custom('TrackDevice', trackDeviceController.list),
  list,
)

/**
 * This function comment is parsed by doctrine
 * @route GET /track-devices/last
 * @group TrackDevice - Operations about TrackDevice
 * @returns {object} 200 -
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
router.get(
  '/track-devices/last',
  (req, res) => res.json({ message: 'success' })
  // trackDeviceController.lastPositionEasyGo,
)

// /**
//  * This function comment is parsed by doctrine
//  * @route POST /job/recap-entity-notification
//  * @group Notification - Operations about TrackDevice
//  * @returns {object} 200 -
//  * @returns {Error}  default - Unexpected error
//  * @security [{"acceptLanguange": [], "JWT":[]}]
//  */
// router.post(
//   '/job/recap-entity-notification',
//   jobController.recapEntityNotification
// )

// /**
//  * This function comment is parsed by doctrine
//  * @route POST /job/check-stock-material
//  * @group Notification - Operations about TrackDevice
//  * @returns {object} 200 -
//  * @returns {Error}  default - Unexpected error
//  * @security [{"acceptLanguange": [], "JWT":[]}]
//  */
router.post(
  '/job/check-stock-material',
  jobController.checkStockMaterial,
)

router.post(
  '/entities/updateBPOMKey',
  isAuthenticate,
  hasRole(['ADMIN', 'SUPERADMIN']),
  entityController.updateBPOMKey,
)

router.use('/user', isAuthenticate, usersRouter)
router.use('/entity', isAuthenticate, entitiesRouter)
router.use('/material', isAuthenticate, materialRouter)
router.use('/material-entity', isAuthenticate, materialEntityRouter)
router.use('/data', isAuthenticate, notHasRole(['VENDOR_IOT']), dataRouter)
router.use('/transaction-type', isAuthenticate, notHasRole(['VENDOR_IOT']), transactionTypeRouter)
router.use('/transaction-reason', isAuthenticate, notHasRole(['VENDOR_IOT']), transactionReasonRouter)
router.use('/batch', isAuthenticate, batchRouter)
router.use('/material-tag', isAuthenticate, materialTagRouter)
router.use('/stock', isAuthenticate, notHasRole(['VENDOR_IOT']), stockRouter)
router.use('/transaction', isAuthenticate, notHasRole(['VENDOR_IOT']), transactionRouter)
router.use('/manufacture', isAuthenticate, manufactureRouter)
router.use('/migration', migrationRouter)
router.use('/request-order', isAuthenticate, notHasRole(['VENDOR_IOT']), requestOrderRouter)

router.use('/yearly-plan', isAuthenticate, yearlyPlanRouter)

router.use('/master_data', isAuthenticate, masterDataRouter)

router.use('/notification', isAuthenticate, notifRouter)
router.use('/biofarma-delete', isAuthenticate, biofarmaDeleteRouter)

router.get(
  '/request-orders',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  filterKeywordQuery('like', ['sales_ref']),
  parameterModel.define('RequestOrder'),
  list,
)

router.use(
  '/order',
  isAuthenticate,
  orderRouterIOT,
)

router.use(
  '/order',
  isAuthenticate,
  notHasRole(['VENDOR_IOT']),
  orderRouter,
)


router.get(
  '/job/biofarma',
  async (req, res, next) => {
    try {
      await checkBiofarmaOrder({isV2: true})
      res.json({ data: 'success' })
    } catch (err) {
      console.log(err)
      next(err)
    }
  },
)

router.use('/v2', routerV2)
router.use('/integration', isAuthenticate, routerIntegration)

/* insert data entity master material activities */
router.get('/insert-entity-material-activities', isAuthenticate, insertData.insertEntityActivities)

router.get('/master-material-types', isAuthenticate, parameterModel.define('MasterMaterialType'),
  (req, res, next)=>{
    const {keyword, activity_id} = req.query
    const condition = []
    if(keyword) condition.push({name : {[Op.like] : `%${keyword}%`}})
    if(activity_id) condition.push({activity_id})

    if(condition.length>0) req.condition = condition

    next()
  },
  list)

router.get('/source-materials', isAuthenticate, parameterModel.simple_keyword('SourceMaterial'), list)
router.get('/pieces-purchase', isAuthenticate, parameterModel.simple_keyword('PiecesPurchase'), list)

router.get('/coldstorages', isAuthenticate, coldstorageController.filter, coldstorageController.customList)
router.get('/coldstorages/xls', isAuthenticate, coldstorageController.filter, coldstorageController.exportXLS)
router.get('/coldstorages/annual-planning', isAuthenticate, coldstorageAnnualPlan.filter, coldstorageAnnualPlan.list)
router.get('/coldstorages/annual-planning/xls', isAuthenticate, coldstorageAnnualPlan.filter, coldstorageAnnualPlan.list)

router.get('/volume-material-manufactures', isAuthenticate, volumeMaterialController.filter, volumeMaterialController.customList)
router.get('/volume-material-manufactures/xls/template', isAuthenticate, volumeMaterialController.excelTemplate)
router.get('/volume-material-manufactures/xls', isAuthenticate, volumeMaterialController.filter, volumeMaterialController.exportExcel)

router.post(
  '/volume-material-manufactures/xls',
  isAuthenticate,
  uploadFile.single('file'),
  validate(xlsValidator.uploadXLS),
  volumeMaterialXlsSchema,
  volumeMaterialController.uploadXLS
)

router.post(
  '/ssl/ifp/picking/order',
  isAuthenticate,
  dinOrderController.sslDinOrder
)

router.use('/volume-material-manufacture', isAuthenticate, volumeMaterialRouter)
router.use('/coldstorage', isAuthenticate, coldstorageRouter)
router.use('/configs', isAuthenticate, configRouter)
router.use('/coldchain-capacity-equipment', isAuthenticate, coldchainCapacityEquipmentRouter)

export default router
