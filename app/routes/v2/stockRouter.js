import express from 'express'
import parameterModel from '../../helpers/parameterModel'

import * as commonController from '../../controllers/commonController'
import * as issueStockController from '../../controllers/v2/stock/issueStockController'
import * as newOpnameController from '../../controllers/v2/newOpname/newOpnameController'
import * as reconciliationController from '../../controllers/v2/reconciliation/reconciliationController'
import * as reportReconController from '../../controllers/v2/reconciliation/reportReconController'
import * as stockController from '../../controllers/v2/stock/stockController'

import newOpnameRouter from './stock/newOpnameRouter'
import reconciliationRouter from './stock/reconciliationRouter'
import opnamePeriodRouter from './opnamePeriodRouter'

const stockRouter = express.Router()

stockRouter.use('/opname-period', opnamePeriodRouter)

/**
 * GET stock listing
 * @route GET /v2/stocks
 * @group Stock V2 - Operations about stock
 * @param {string} keyword.query - name master activity
 * @param {integer} activity_id.query - Activity ID
 * @param {integer} entity_id.query - Entity ID
 * @param {integer} material_id.query - Material ID
 * @param {string} expired_start_date.query - Expired Start Date - 2020-10-15
 * @param {string} expired_end_date.query - Expired End Date - 2020-10-15
 * @param {string} no_batch.query - No Batch - AAAA
 * @param {string} batch_ids.query - Batch Ids(separate with ,) - 1,2,3
 * @param {string} province_id.query - Province ID - 1
 * @param {string} regency_id.query - Regency ID - 1
 * @param {string} sub_district_id.query - Sub District ID - 1
 * @param {string} entity_tag_id.query - Entity Tag ID - 1
 * @param {string} only_have_qty.query - Only Have Qty (0/1) - 1
 * @param {string} is_vaccine.query - is_vaccine(0/1) - 1
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @returns {object} 200 - {
 * "total": 0,
 * "page": 1,
 * "perPage": 10,
 * "list": [{
 *   "id": 1,
 *   "name": "Routine"
 *  }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/**
 * Get stock issue
 * @route GET /v2/stock/issue
 * @group Stock V2 - Operations about Stock
 * @param {integer} material_id.query - material_id - 1
 * @param {integer} entity_id.query - entity_id - 1
 * @param {integer} customer_id.query - customer_id - 1
 * @param {integer} activity_id.query - activity_id - 1
 * @returns {object} 200 - {
 *    [{ "id": 1, "name": "Material", "stock": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
stockRouter.get(
  '/issue',
  parameterModel.custom('EntityMasterMaterial', issueStockController.issueStock),
  commonController.unlimitedList
)

stockRouter.get(
  '/new-opnames/xls',
  newOpnameController.list,
  newOpnameController.exportExcel,
)

stockRouter.get(
  '/new-opnames',
  parameterModel.custom('NewOpnameStock', newOpnameController.list),
  commonController.list,
)

/* routes sementara untuk get new-opnames */
stockRouter.get('/new-opnames-temp', newOpnameController.listTemp)


stockRouter.get(
  '/reconciliations',
  parameterModel.custom('Reconciliation', reconciliationController.list),
  commonController.list,
)

/* GET opname_stocks material listing. */
/**
 * GET list opname_stocks
 * @route GET /v2/stock/reconciliations/xls
 * @group Reconciliation - Operations about Reconciliation
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {integer} activity_id.query - activity_id
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {string} province_id.query - province_id
 * @param {string} regency_id.query - regency_id
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
stockRouter.get(
  '/reconciliations/xls',
  reconciliationController.list,
  reconciliationController.exportExcel,
)

/* GET opname_stocks material listing. */
/**
 * GET bar_report opname_stocks
 * @route GET /v2/stock/reconciliations/bar_report
 * @group Reconciliation - Operations about Reconciliation
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {integer} activity_id.query - activity_id
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {string} province_id.query - province_id
 * @param {string} regency_id.query - regency_id
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
stockRouter.get(
  '/reconciliations/bar_report',
  reportReconController.barReport,
)

/**
 * GET entity_report opname_stocks
 * @route GET /v2/stock/reconciliations/entity_report
 * @group Reconciliation - Operations about Reconciliation
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {integer} activity_id.query - activity_id
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {string} province_id.query - province_id
 * @param {string} regency_id.query - regency_id
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
stockRouter.get(
  '/reconciliations/entity_report',
  reportReconController.entityReport,
)

/**
 * GET Download entity_report opname_stocks
 * @route GET /v2/stock/reconciliations/entity_report/xls
 * @group Reconciliation - Operations about Reconciliation
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {integer} activity_id.query - activity_id
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {string} province_id.query - province_id
 * @param {string} regency_id.query - regency_id
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
stockRouter.get(
  '/reconciliations/entity_report/xls',
  reportReconController.entityReportXLS,
)

/**
 * GET stock detail
 * @route GET /v2/stock/{id}
 * @group Stock V2 - Operations about stock
 * @param {id} id.path - id master activity
 * @returns {object} 201 - {}
 * @security [{"JWT":[]}]
 * @returns {Error} default 500 - { message: "Internal server error" }
 */

stockRouter.get(
  '/unsubmit_qty',
  stockController.filter,
  stockController.preDataNewOpname
)

stockRouter.get(
  '/:id',
  parameterModel.define('EntityMasterMaterial'),
  commonController.detail
)

stockRouter.use('/new-opname', newOpnameRouter)
stockRouter.use('/reconciliation', reconciliationRouter)

export default stockRouter
