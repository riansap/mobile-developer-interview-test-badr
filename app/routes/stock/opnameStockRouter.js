import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import { detail } from '../../controllers/commonController'
import * as opnameStockController from '../../controllers/opnameStock/opnameStockController'
import * as opnameStockValidator from '../../validators/opnameStockValidator'
import { validate } from '../../validators'

const opnameStockRouter = express.Router()

/* GET opname_stock material listing. */
/**
 * Generate opname_stock
 * @route GET /stock/opname_stock/generate
 * @group Opname Stock - Operations about Opname Stock
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnameStockRouter.get(
  '/generate',
  opnameStockController.generate
)

/* GET opname_stock material listing. */
/**
 * GET detail opname_stock
 * @route GET /stock/opname_stock/{id}
 * @group Opname Stock - Operations about Opname Stock
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnameStockRouter.get(
  '/:id',
  parameterModel.custom('OpnameStock', opnameStockController.detail),
  detail
)

/* POST opname_stock material listing. */
/**
 * POST detail opname_stock
 * @route POST /stock/opname_stock
 * @group Opname Stock - Operations about Opname Stock
 * @param {object} data.body create - opname_stock
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnameStockRouter.post(
  '/',
  validate(opnameStockValidator.create),
  opnameStockController.create
//   parameterModel.define('OpnameStock'),
//   create
)

/* GET opname-stock bar. */
/**
 * GET bar opname-stocks
 * @route GET /stock/opname_stocks/bar_report
 * @group Opname Stock - Operations about Opname Stock
 * @param {integer} year.query - Year
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {integer} province_id.query - province_id
 * @param {integer} regency_id.query - regency_id
 * @param {integer} entity_id.query - entity_id
 * @param {string} entity_tag_ids.query - entity_tag_ids (join with ,)
 * @returns {object} 200 -
 * { "intervalPeriod": ["2021 01", "2021 02"],
 *   "overview": [{
 *      "label": "2021 01",
 *      "value": 1598
 *    }, {
 *      "label": "2021 02",
 *      "value": 1774
 *    }],
 *   "column": [{
 *      "label": "2021 Jan"
 *    }, {
 *      "label": "2021 Feb"
 *    }],
 *  "subColumn": ["value"]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET opname-stock entity_report. */
/**
 * GET entity_report opname-stocks
 * @route GET /stock/opname_stocks/entity_report
 * @group Opname Stock - Operations about Opname Stock
 * @param {integer} year.query - Year
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {integer} province_id.query - province_id
 * @param {integer} regency_id.query - regency_id
 * @param {integer} entity_id.query - entity_id
 * @param {string} entity_tag_ids.query - entity_tag_ids (join with ,)
 * @returns {object} 200 -
 * { "month": "",
 *   "intervalPeriod": [],
 *   "total": 10907,
 *   "page": 1,
 *   "perPage": 10,
 *   "list": [{
 *      "id": 1,
 *      "name": "Kemenkes RI",
 *      "total_frequency": 270,
 *      "average_frequency": 38.57142857,
 *      "overview": [61, 43]
 *    }]
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET opname-stock entity_report. */
/**
 * GET entity_report opname-stocks
 * @route GET /stock/opname_stocks/entity_report/xls
 * @group Opname Stock - Operations about Opname Stock
 * @param {integer} year.query - Year
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @param {integer} province_id.query - province_id
 * @param {integer} regency_id.query - regency_id
 * @param {integer} entity_id.query - province_id
 * @param {string} entity_tag_ids.query - entity_tag_ids (join with ,)
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
export default opnameStockRouter
