import express from 'express'
import parameterModel from '../../../helpers/parameterModel'
import { detail } from '../../../controllers/commonController'
import * as reconciliationController from '../../../controllers/v2/reconciliation/reconciliationController'
import * as reconciliationValidator from '../../../validators/v2/reconciliationValidator'
import { validate } from '../../../validators'

const reconciliationRouter = express.Router()

/* GET reconciliation material listing. */
/**
 * Generate reconciliation
 * @route GET /v2/stock/reconciliations
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
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET reconciliation material listing. */
/**
 * Generate reconciliation
 * @route GET /v2/stock/reconciliation/generate
 * @group Reconciliation - Operations about Reconciliation
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} start_date.query - start_date
 * @param {string} end_date.query - end_date
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
reconciliationRouter.get(
  '/generate',
  // (req, res, next) => {
  //   return res.status(403).json({ message: 'akses menu ini dihentikan sementara' })
  // },
  // reconciliationController.generate
  reconciliationController.generateV2

)

reconciliationRouter.get(
  '/generate-v2',
  reconciliationController.generateV2
)

reconciliationRouter.get(
  '/generate-v2',
  reconciliationController.generateV2
)

/* GET reconciliation material listing. */
/**
 * GET detail reconciliation
 * @route GET /v2/stock/reconciliation/{id}
 * @group Reconciliation - Operations about Reconciliation
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
reconciliationRouter.get(
  '/:id',
  parameterModel.custom('Reconciliation', reconciliationController.detail),
  detail
)

/* POST reconciliation material listing. */
/**
 * POST detail reconciliation
 * @route POST /v2/stock/reconciliation
 * @group Reconciliation - Operations about Reconciliation
 * @param {object} data.body create - reconciliation
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
reconciliationRouter.post(
  '/',
  validate(reconciliationValidator.create),
  reconciliationController.create
)

/* GET opname-stock bar. */
/**
 * GET bar opname-stocks
 * @route GET /v2/stock/reconciliations/bar_report
 * @group Reconciliation - Operations about Reconciliation
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
 * @route GET /v2/stock/reconciliations/entity_report
 * @group Reconciliation - Operations about Reconciliation
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
 * @route GET /v2/stock/reconciliations/entity_report/xls
 * @group Reconciliation - Operations about Reconciliation
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
export default reconciliationRouter
