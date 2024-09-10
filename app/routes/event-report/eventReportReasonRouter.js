import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import {
  create, update, detail, destroy,
} from '../../controllers/commonController'
import { hasRole } from '../../middlewares/authMiddleware'

const eventReportReasonRouter = express.Router()

/* GET event-report detail. */
/**
 * GET detail event-report-reason
 * @route GET /order/event-report-reason/{id}
 * @group Event Report - Operations about Event Report/Laporan Kejadian
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonRouter.get(
  '/:id',
  parameterModel.define('EventReportReason'),
  detail,
)

/* POST event-report update. */
/**
 * POST detail event-report-reason
 * @route POST /order/event-report-reason
 * @group Event Report - Operations about Event Report
 * @param {object} data.body create - event-report
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonRouter.post(
  '/',
  hasRole(['SUPERADMIN']),
  parameterModel.define('EventReportReason'),
  create,
)

/* POST event-report update. */
/**
 * POST detail event-report-reason
 * @route POST /order/event-report-reason/{id}
 * @group Event Report - Operations about Event Report
 * @param {object} data.body create - event-report
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonRouter.post(
  '/:id',
  hasRole(['SUPERADMIN']),
  parameterModel.define('EventReportReason'),
  update,
)

/* DELETE event-report update. */
/**
 * DELETE detail event-report-reason
 * @route DELETE /order/event-report-reason/{id}
 * @group Event Report - Operations about Event Report
 * @param {object} data.body create - event-report
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
eventReportReasonRouter.delete(
  '/:id',
  hasRole(['SUPERADMIN']),
  parameterModel.define('EventReportReason'),
  destroy,
)

export default eventReportReasonRouter
