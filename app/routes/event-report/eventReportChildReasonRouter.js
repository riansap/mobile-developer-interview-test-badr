import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import {
  create, update, detail, destroy,
} from '../../controllers/commonController'
import { hasRole } from '../../middlewares/authMiddleware'

const eventReportReasonChildRouter = express.Router()

/* GET event-report detail. */
/**
 * GET detail event-report-child-reason
 * @route GET /order/event-report-child-reason/{id}
 * @param {integer} parent_id.query - Parent ID
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonChildRouter.get(
  '/:id',
  parameterModel.define('EventReportChildReason'),
  detail,
)

/* POST event-report update. */
/**
 * POST detail event-report-child-reason
 * @route POST /order/event-report-child-reason
 * @group Event Report - Operations about Event Report
 * @param {object} data.body create - event-report
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonChildRouter.post(
  '/',
  hasRole(['SUPERADMIN']),
  parameterModel.define('EventReportChildReason'),
  create,
)

/* POST event-report update. */
/**
 * POST detail event-report-child-reason
 * @route POST /order/event-report-child-reason/{id}
 * @group Event Report - Operations about Event Report
 * @param {object} data.body create - event-report
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonChildRouter.post(
  '/:id',
  hasRole(['SUPERADMIN']),
  parameterModel.define('EventReportChildReason'),
  update,
)

/* DELETE event-report update. */
/**
 * DELETE detail event-report-child-reason
 * @route DELETE /order/event-report-child-reason/{id}
 * @group Event Report - Operations about Event Report
 * @param {object} data.body create - event-report
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonChildRouter.delete(
  '/:id',
  hasRole(['SUPERADMIN']),
  parameterModel.define('EventReportChildReason'),
  destroy,
)

export default eventReportReasonChildRouter
