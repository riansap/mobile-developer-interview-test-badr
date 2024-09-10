import express from 'express'
// import models from '../models'
import * as commonController from '../controllers/commonController'
import * as notificationController from '../controllers/notificationController'
import parameterModel from '../helpers/parameterModel'
import { cacheUrl } from '../middlewares/redisMiddleware'
import { validate } from '../validators'
import { create } from '../validators/notifValidator'

const notifRouter = express.Router()

/**
 * @typedef Notification
 * @property {integer} id - ID - eg:1
 * @property {integer} user_id - User ID - eg:1
 * @property {integer} province_id - Province ID - eg:31
 * @property {integer} regency_id - Regency ID  - eg:3171
 * @property {integer} entity_id - Entity ID - eg:13
 * @property {string} message - Message - eg:Notification
 * @property {string} title - Title - eg:Title
 * @property {string} type - Type - eg:ed-1
 * @property {string} created_at - Created At - eg:1990-01-01
 * @property {string} read_at - Read At - eg:1990-01-01
 */

/* GET notif count. */
/**
 * Get notification count
 * @route GET /notification/count-notif
 * @group Notification - Operations about Notification
 * @returns {object} 200 - { "unread": 10 }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

notifRouter.get(
  '/count-notif',
  (req,res,next) => {
    req.expire = 30
    req.withUser = true
    cacheUrl(req,res,next)
  },
  notificationController.countNotif
)

/* GET Notif detail. */
/**
 * Get notification detail
 * @route GET /notification/{id}
 * @group Notification - Operations about Notification
 * @param {id} id.path - id user
 * @returns {Notification.model} 200 - {}
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

notifRouter.get(
  '/types',
  parameterModel.define('NotificationType'),
  commonController.list
)

notifRouter.get(
  '/:id',
  parameterModel.define('Notification'),
  commonController.detail
)

/* POST Notif bulk read. */
/**
 * Update notification bulk read
 * @route POST /notification/bulk-read
 * @group Notification - Operations about Notification
 * @returns {object} 200 - { message: 'Sukses' }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

notifRouter.post(
  '/bulk-read',
  notificationController.bulkRead,
)

notifRouter.post(
  '/stop-notification-patient',
  validate(create),
  notificationController.stopNotifPatient
)



/* POST Notif read. */
/**
 * Update notification read
 * @route POST /notification/{id}/read
 * @group Notification - Operations about Notification
 * @param {id} id.path - id user
 * @returns {object} 200 - { message: 'Sukses' }
 * @returns {object} 404 - {
 *   "error": "Data not found"
 * }
 * @returns {Error} default 500 - { message: "Internal server error" }
 * @security [{"acceptLanguange": [], "JWT":[]}]
 */

notifRouter.post(
  '/:id/read',
  notificationController.read,
)

export default notifRouter
