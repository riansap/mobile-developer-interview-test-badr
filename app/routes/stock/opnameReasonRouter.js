import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import { create, update, detail, destroy } from '../../controllers/commonController'
import { hasRole } from '../../middlewares/authMiddleware'
import { USER_ROLE } from '../../helpers/constants'

const opnameReasonRouter = express.Router()

/* GET opname_reason detail. */
/**
 * GET detail opname_reason
 * @route GET /stock/opname_reason/{id}
 * @group Opname Stock - Operations about Opname Stock
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

opnameReasonRouter.get(
  '/:id',
  parameterModel.define('OpnameReason'),
  detail
)

opnameReasonRouter.post(
  '/',
  hasRole([USER_ROLE.SUPERADMIN]),
  parameterModel.define('OpnameReason'),
  create
)

opnameReasonRouter.put(
  '/:id',
  hasRole([USER_ROLE.SUPERADMIN]),
  parameterModel.define('OpnameReason'),
  update
)

opnameReasonRouter.delete(
  '/:id',
  hasRole([USER_ROLE.SUPERADMIN]),
  parameterModel.define('OpnameReason'),
  destroy
)

export default opnameReasonRouter