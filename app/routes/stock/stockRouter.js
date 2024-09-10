import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import * as stockController from '../../controllers/stockController'
import { unlimitedList, list } from '../../controllers/commonController'
import * as opnameStockController from '../../controllers/opnameStock/opnameStockController'
import * as reportOpnameStockController from '../../controllers/opnameStock/reportOpnameStockController'
import * as newOpnameController from '../../controllers/newOpname/newOpnameController'

import opnameActionRouter from './opnameActionRouter'
import opnameReasonRouter from './opnameReasonRouter'
import opnameStockRouter from './opnameStockRouter'
import newOpnameRouter from './newOpnameRouter'

const stockRouter = express.Router()

/* GET stocks listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /stocks
 * @group Stock - Operations about transaction type
 * @param {string} keyword.query - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {string} expired_start_date.query - Expired Start Date - 2020-10-15
 * @param {string} expired_end_date.query - Expired End Date - 2020-10-15
 * @param {string} no_batch.query - No Batch - AAAA
 * @param {string} batch_ids.query - Batch Ids(separate with ,) - 1,2,3
 * @param {string} material_tag_id.query - Material Tag - 1
 * @param {string} material_id.query - Material ID - 1
 * @param {string} entity_id.query - Entity ID - 1
 * @param {string} province_id.query - Province ID - 1
 * @param {string} regency_id.query - Regency ID - 1
 * @param {string} sub_district_id.query - Sub District ID - 1
 * @param {string} entity_tag_id.query - Entity Tag ID - 1
 * @param {string} only_have_qty.query - Only Have Qty (0/1) - 1
 * @param {string} is_vaccine.query - is_vaccine(0/1) - 1
 * @returns {object} 200 - {
 *   "total": 0,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{ "id": 1, "name": "Dinas Kesehatan", "address": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */

/**
 * This function comment is parsed by doctrine
 * @route GET /stocks/xls
 * @group Stock - Operations about transaction type
 * @param {string} keyword.query - Keyword
 * @param {integer} page.query - Page - 1
 * @param {integer} paginate.query - Paginate - 10
 * @param {string} expired_start_date.query - Expired Start Date - 2020-10-15
 * @param {string} expired_end_date.query - Expired End Date - 2020-10-15
 * @param {string} material_tag_id.query - Material Tag - 1
 * @param {string} material_id.query - Material ID - 1
 * @param {string} entity_id.query - Entity ID - 1
 * @param {string} province_id.query - Province ID - 1
 * @param {string} regency_id.query - Regency ID - 1
 * @param {string} sub_district_id.query - Sub District ID - 1
 * @param {string} entity_tag_id.query - Entity Tag ID - 1
 * @param {string} batch_ids.query - Batch Ids(separate with ,) - 1,2,3
 * @returns {object} 200 - {
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */

/* GET stock material listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /stock/material
 * @group Stock - Operations about stock material
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @returns {object} 200 - [
 * {
 *   "on_hand": 0,
 *   "allocated": 0,
 *   "id": 1,
 *   "material_entity_id": 1,
 *   "batch_id": 1,
 *   "status": 1,
 *   "qty": 100,
 *   "created_by": 1,
 *   "updated_by": 1,
 *   "createdAt": "2020",
 *   "updatedAt": "2020",
 *   "batch": {
 *     "manufacture_name": "Serum Institute Of India",
 *     "id": 1,
 *     "code": "BCG1",
 *     "expired_date": "1990",
 *     "production_date": "2020",
 *     "manufacture_id": 1,
 *     "manufacture": {
 *       "name": "Serum Institute Of India",
 *       "address": "Pasirtanjung, Jawa Barat, ID"
 *     }
 *  }
 * }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

stockRouter.get('/material',
  parameterModel.custom('Stock', stockController.listPerMaterial),
  unlimitedList)

// stock issue
/* GET transactions stock summary listing. */
/**
 * This function comment is parsed by doctrine
 * @route GET /stock/issue
 * @group Stock - Operations about transactions
 * @param {integer} material_id.query - material_id - 1
 * @param {integer} entity_id.query - entity_id - 1
 * @param {integer} customer_id.query - customer_id - 1
 * @param {integer} material_tag_id.query - material tag id - 1
 * @returns {object} 200 - {
 *    [{ "id": 1, "name": "Material", "stock": "Jakarta timur" }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */
stockRouter.get('/issue',
  // stockController.issueStock,
  parameterModel.custom('MaterialEntity', stockController.issueStock),
  unlimitedList)

/* GET opname_stocks material listing. */
/**
 * GET list opname_reasons
 * @route GET /stock/opname_reasons
 * @group Opname Stock - Operations about Opname Stock
 * @returns {object} 200 - {
 * list: [
 *    {
 *      id: 1,
 *      title: 'string',
 *      updated_at: '2020-01-01',
 *      created_at: '2020-01-01',
 *      updated_by: 1,
 *    }],
 * page: 1,
 * perPage: 10,
 * total: 100
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

stockRouter.get(
  '/opname_reasons',
  parameterModel.custom('OpnameReason', opnameStockController.listOpnameReason),
  list,
)

stockRouter.use('/opname_reason', opnameReasonRouter)

/* GET opname_stocks material listing. */
/**
 * GET list opname_actions
 * @route GET /stock/opname_actions
 * @group Opname Stock - Operations about Opname Stock
 * @returns {object} 200 - {
 * list: [
 *    {
 *      id: 1,
 *      title: 'string',
 *      updated_at: '2020-01-01',
 *      created_at: '2020-01-01',
 *      updated_by: 1,
 *    }],
 * page: 1,
 * perPage: 10,
 * total: 100
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
stockRouter.get(
  '/opname_actions',
  parameterModel.custom('OpnameAction', function(req, res, next){
    req.mappingDocs = ({ docs }) => docs.map((data) =>{
      let item = {
        ...data.dataValues
      }
      item.title = req.__(`reconciliation.action.${item.id}`)
      return item
    })
    next()
  }),
  list,
)

stockRouter.use('/opname_action', opnameActionRouter)

/* GET opname_stocks material listing. */
/**
 * GET list opname_stocks
 * @route GET /stock/opname_stocks/xls
 * @group Opname Stock - Operations about Opname Stock
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {string} province_id.query - province_id
 * @param {string} regency_id.query - regency_id
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
stockRouter.get(
  '/opname_stocks/xls',
  opnameStockController.list,
  opnameStockController.exportExcel,
)

stockRouter.get(
  '/opname_stocks/bar_report',
  reportOpnameStockController.barReport,
)

stockRouter.get(
  '/opname_stocks/entity_report',
  reportOpnameStockController.entityReport,
)

stockRouter.get(
  '/opname_stocks/entity_report/xls',
  reportOpnameStockController.entityReportXLS,
)

/* GET opname_stocks material listing. */
/**
 * GET list opname_stocks
 * @route GET /stock/opname_stocks
 * @group Opname Stock - Operations about Opname Stock
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {string} province_id.query - province_id
 * @param {string} regency_id.query - regency_id
 * @returns {object} 200 - {
 * list: [
 *    {
 *      id: 1,
 *      material_id: 1,
 *      entity_id: 1,
 *      start_date: '2020-01-01',
 *      end_date: '2020-01-01',
 *      updated_at: '2020-01-01',
 *      created_at: '2020-01-01',
 *      updated_by: 1,
 *      opname_stock_items : [{
 *        stock_category: 1,
 *        stock_category_label: 'string',
 *        smile_qty: 0,
 *        real_qty: 0,
 *        reasons: [
 *          { id: 1, title: 'string' }
 *        ],
 *        actions: [
 *          { id: 1, title: 'string' }
 *        ]
 *      }]
 *    }],
 * page: 1,
 * perPage: 10,
 * total: 100
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
stockRouter.get(
  '/opname_stocks',
  parameterModel.custom('OpnameStock', opnameStockController.list),
  list,
)

stockRouter.get(
  '/new-opnames/xls',
  newOpnameController.list,
  newOpnameController.exportExcel,
)

stockRouter.get(
  '/new-opnames',
  parameterModel.custom('NewOpnameStock', newOpnameController.list),
  list,
)

stockRouter.use('/opname_stock', opnameStockRouter)
stockRouter.use('/new-opname', newOpnameRouter)

export default stockRouter
