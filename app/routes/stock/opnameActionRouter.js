import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import { create, update, detail, destroy } from '../../controllers/commonController'
import { hasRole } from '../../middlewares/authMiddleware'
import { USER_ROLE } from '../../helpers/constants'

const opnameActionRouter = express.Router()

/* GET opname_action detail. */
/**
 * GET detail opname_action
 * @route GET /stock/opname_action/{id}
 * @group Opname Stock - Operations about Opname Stock
 * @returns {object} 200 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

opnameActionRouter.get(
  '/:id',
  parameterModel.define('OpnameAction'),
  detail
)

opnameActionRouter.post(
  '/',
  hasRole([USER_ROLE.SUPERADMIN]),
  parameterModel.define('OpnameAction'),
  create
)

opnameActionRouter.put(
  '/:id',
  hasRole([USER_ROLE.SUPERADMIN]),
  parameterModel.define('OpnameAction'),
  update
)

opnameActionRouter.delete(
  '/:id',
  hasRole([USER_ROLE.SUPERADMIN]),
  parameterModel.define('OpnameAction'),
  destroy
)

export default opnameActionRouter