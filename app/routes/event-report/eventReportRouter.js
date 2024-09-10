import express from 'express'
import rateLimit from 'express-rate-limit'

import parameterModel from '../../helpers/parameterModel'
import { detail } from '../../controllers/commonController'
import * as eventReportController from '../../controllers/eventReport/eventReportController'
import * as eventReportValidator from '../../validators/eventReportValidator'
import { validate } from '../../validators'
import { hasRole } from '../../middlewares/authMiddleware'

import { limitterOptions } from '../../helpers/services/rateLimiterHelper'

const eventReportRouter = express.Router()

const eventReportLimit = rateLimit(limitterOptions)

/* GET event-report list. */
/**
 * GET list event-reports
 * @route GET /order/event-reports
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} from_arrived_date.query - from_arrived_date
 * @param {string} to_arrived_date.query - to_arrived_date
 * @param {string} updated_at.query - updated_at
 * @param {integer} order_id.query - order_id
 * @param {integer} province_id.query - province_id
 * @param {string} status.query - status (1,2,3)
 * @param {integer} regency_id.query - regency_id
 * @param {string} no_packing_slip.query - no_packing_slip
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET event-report xls. */
/**
 * GET xls event-reports
 * @route GET /order/event-reports/xls
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {integer} material_id.query - id material
 * @param {integer} entity_id.query - id entity
 * @param {string} entity_tag_ids.query - entity tag id
 * @param {string} from_arrived_date.query - from_arrived_date
 * @param {string} to_arrived_date.query - to_arrived_date
 * @param {string} updated_at.query - updated_at
 * @param {integer} order_id.query - order_id
 * @param {integer} province_id.query - province_id
 * @param {string} status.query - status (1,2,3)
 * @param {integer} regency_id.query - regency_id
 * @param {string} no_packing_slip.query - no_packing_slip
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/**
 * GET list event-report-statuses
 * @route GET /order/event-report-statuses
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {integer} entity_id.query - id entity
 * @returns {object} 200 - [
 * { status: integer, total: integer, label: string }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* EventReport Model. */
/**
 * @typedef EventReportForm
 * @property {number} entity_id.required - 1 - Entity id - eg:1
 * @property {number} has_order.required - 1 - has order [0/1] - eg:1
 * @property {string} arrived_date.required - arrived_date - eg:2020-12-31
 * @property {string} no_packing_slip - No Packing Slip - eg:string
 * @property {number} order_id - Order ID - eg:123456
 * @property {Array.<EventReportComment>} comments -
 * @property {Array.<EventReportItem>} items -
 */

/* EventReportItem Model. */
/**
 * @typedef EventReportItem
 * @property {number} material_id - 1 - Material id (nullable) - eg:1
 * @property {string} custom_material - 0 - Custom Material Name (0/1) - eg:Custom Name
 * @property {number} no_batch.required - 1 - Entity id - eg:1
 * @property {string} expired_date.required - Expired Date - eg:2020-12-31
 * @property {number} qty.required - 1 - Qty - eg:1
 * @property {number} reason_id - Alasan - eg:1
 * @property {number} child_reason_id - Detail Alasan - eg:1
 */

/* EventReportComment Model. */
/**
 * @typedef EventReportComment
 * @property {string} comment.required - 1 - Comment - eg:1
 */

/* EventReportStatus Model. */
/**
 * @typedef EventReportStatus
 * @property {number} status.required - 1 - Status - eg:1
 * @property {string} comment - Comment - comment - eg:Komentar
 */

/* EventReportLink Model. */
/**
 * @typedef EventReportLink
 * @property {string} link.required - 1 - Link - eg:http://url.com
 */

/* GET event-report detail. */
/**
 * GET detail event-report
 * @route GET /order/event-report/{id}
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {id} id.path - id event report
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

eventReportRouter.get(
  '/v2/:id',
  parameterModel.define('EventReport'),
  detail
)

eventReportRouter.get(
  '/:id',
  parameterModel.define('EventReport'),
  detail,
)



/* POST event-report material listing. */
/**
 * POST create event-report
 * @route POST /order/event-report
 * @group Event Report - Operations about Event Report
 * @param {EventReportForm.model} data.body create - event-report
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportRouter.post(
  '/',
  hasRole(['MANAGER', 'MANAGER_COVID', 'SUPERADMIN']),
  validate(eventReportValidator.create),
  eventReportController.create,
)

/* POST event-report status. */
/**
 * POST update status event-report
 * @route POST /order/event-report/{id}/status
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {id} id.path - id event report
 * @param {EventReportStatus.model} data.body update status - event-report
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportRouter.post(
  '/:id/status',
  eventReportLimit,
  validate(eventReportValidator.status),
  eventReportController.updateStatus,
)

/* POST event-report link. */
/**
 * POST update link event-report
 * @route POST /order/event-report/{id}/link
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {id} id.path - id event report
 * @param {EventReportLink.model} data.body update link - event-report
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportRouter.post(
  '/:id/link',
  hasRole(['SUPERADMIN']),
  validate(eventReportValidator.link),
  eventReportController.updateLink,
)

/* GET event-report histories. */
/**
 * GET histories event-report
 * @route GET /order/event-report/{id}/histories
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {id} id.path - id event report
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportRouter.get(
  '/:id/histories',
  eventReportController.histories,
)

/* GET event-report statuses. */
/**
 * GET statuses event-report
 * @route GET /order/event-report/{id}/statuses
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @param {id} id.path - id event report
 * @returns {object} 200 - [
 * { status: 'integer', label: 'Description' }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportRouter.get(
  '/:id/statuses',
  eventReportController.listUpdateStatus,
)

export default eventReportRouter
