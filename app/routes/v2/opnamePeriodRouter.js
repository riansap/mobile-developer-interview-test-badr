import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import * as commonController from '../../controllers/commonController'
import opnamePeriodController from '../../controllers/v2/opnamePeriodController'
import opnamePeriodValidator from '../../validators/v2/opnamePeriodValidator'
import { validate } from '../../validators'
import { hasRole } from '../../middlewares/authMiddleware'

const opnamePeriodRouter = express.Router()

/* GET opname period listing. */
/**
 * GET list opname period
 * @route GET /stock/opname-period
 * @group Opname Period - Operations about Opname Period
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnamePeriodRouter.get(
  '/',
  hasRole(['SUPERADMIN', 'ADMIN', 'OPERATOR', 'MANAGER', 'OPERATOR_COVID', 'MANAGER_COVID']),
  validate(opnamePeriodValidator.list),
  parameterModel.custom('OpnamePeriod', opnamePeriodController.list),
  commonController.list,
)

/* GET opname-period listing. */
/**
 * GET list opname-period
 * @route GET /stock/opname-period/xls
 * @group New Opname - Operations about Opname Period
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

opnamePeriodRouter.get(
  '/xls',
  hasRole(['SUPERADMIN', 'ADMIN',]),
  parameterModel.custom('OpnamePeriod', opnamePeriodController.list),
  opnamePeriodController.exportXLS,
)

/* GET opname-period detail. */
/**
 * GET detail opname-period
 * @route GET /stock/opname-period/{id}
 * @group New Opname - Operations about New Opname
 * @param {id} id.path - id opname-period
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnamePeriodRouter.get(
  '/:id',
  hasRole(['SUPERADMIN', 'ADMIN']),
  parameterModel.custom('OpnamePeriod', opnamePeriodController.opnamePeriodAssociation),
  commonController.detail,
)

/* OpnamePeriod Model. */
/**
 * @typedef OpnamePeriod
 * @property {integer} start_date
 * @property {integer} end_date
 * @property {string} status
 */

/* POST opname period material listing. */
/**
 * POST new opname-period
 * @route POST /stock/opname-period
 * @group Opaname Period - Operations about Opname Period
 * @param {OpnamePeriod.model} data.body create - opname-period
 * @returns {object} 201 - [ ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnamePeriodRouter.post(
  '/',
  hasRole(['SUPERADMIN', 'ADMIN']),
  validate(opnamePeriodValidator.create),
  parameterModel.custom('OpnamePeriod', opnamePeriodController.updateAllStatusPeriod),
  commonController.create,
)

/* PUT opname period material edit. */
/**
 * PUT edit opname-period
 * @route PUT /stock/opname-period
 * @group Opname Period - Operations about Opname Period
 * @param {OpnamePeriod.model} data.body create - opname-period
 * @returns {object} 201 - [ ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnamePeriodRouter.put(
  '/:id',
  hasRole(['SUPERADMIN', 'ADMIN']),
  validate(opnamePeriodValidator.update),
  parameterModel.custom('OpnamePeriod', opnamePeriodController.updateAllStatusPeriod),
  commonController.update,
)

/* PATCH opname period material status update. */
/**
 * PATCH edit opname-period
 * @route PATCH /stock/opname-period
 * @group Opname Period - Operations about Opname Period
 * @param {OpnamePeriod.model} data.body create - opname-period
 * @returns {object} 201 - [ ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
opnamePeriodRouter.patch(
  '/:id',
  hasRole(['SUPERADMIN', 'ADMIN']),
  opnamePeriodController.updateAllStatusPeriod,
  opnamePeriodController.updateStatus
)

export default opnamePeriodRouter
