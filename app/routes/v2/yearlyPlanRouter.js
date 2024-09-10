import express from 'express'
import * as yearlyTargetController from '../../controllers/yearlyTargetController'
import * as yearlyPlanController from '../../controllers/yearlyPlanController'
import * as yearlyIPVControllerV1 from '../../controllers/yearlyIPVController'
import * as yearlyResultControllerV1 from '../../controllers/yearlyResultController'

import * as yearlyIPVControllerV2 from '../../controllers/v2/yearlyPlan/yearlyIPVController'
import * as yearlyResultControllerV2 from '../../controllers/v2/yearlyPlan/yearlyResultController'
import * as yearlyMinMaxController from '../../controllers/v2/yearlyPlan/yearlyMinMaxController'
import { validate } from '../../validators'
import * as yearlyPlanValidator from '../../validators/v2/yearlyPlanValidator'

const yearlyPlanRouter = express.Router()

/**
 * This function comment is parsed by doctrine
 * @route GET /v2/yearly-plan/target/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @param {integer} entity_id.query - 1 - Entity ID (faskes)
 * @group Yearly Plan - Operations about yearly plan
 * @returns {YearlyPlan.model} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/target/:entity_regency_id/:year', yearlyTargetController.detail)

/**
 * Update target yearly plan
 * @route PUT /v2/yearly-plan/target/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @param {YearlyPlan.model} data.body - Update - Yearly Plan
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.put('/target/:entity_regency_id/:year', yearlyTargetController.update)

/**
 * Submit step yearly plan form
 * @route PUT /v2/yearly-plan/target/{entity_regency_id}/{year}/next
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @param {YearlyPlanStep.model} data.body - Update - Yearly Plan
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.put('/target/:entity_regency_id/:year/next', yearlyTargetController.nextStep)

/**
 * Submit step yearly plan form
 * @route GET /v2/yearly-plan/target/{entity_regency_id}/{year}/last-step
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @returns {YearlyPlanStep.model} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/target/:entity_regency_id/:year/last-step', yearlyTargetController.lastStep)

/* YearlyPlanIPV Model. */
/**
 * @typedef YearlyPlanIPV2
 * @property {integer} id - 1 - Yearly Plan IPV id - eg:1
 * @property {integer} material_id - 1 - Material_id - eg:1
 * @property {integer} activity_id - 1 - Activity_id - eg:1
 * @property {integer} entity_id - 1 - Material_id - eg:1
 * @property {decimal} custom_ipv - 1 - Indeks pemakaian nasional final - eg:1,0
 * @property {integer} created_by - 1 - created_by - eg:1
 * @property {integer} updated_by - 1 - updated_by - eg:1
 * @property {MasterIPV.model} master_ipv
 */

/**
 * Get yearly plan IPV data
 * @route GET /v2/yearly-plan/ipv/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @param {integer} entity_id.query - 1 - Entity Id (Faskes)
 * @param {integer} page.query - 1- Page
 * @param {integer} paginate.query - 1- Paginate
 * @group Yearly Plan - Operations about transaction type
 * @returns {YearlyPlanIPV2.model} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/ipv/:entity_regency_id/:year', yearlyIPVControllerV2.detail)

/**
 * POST yearly plan IPV data
 * @route PUT /v2/yearly-plan/ipv/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @param {Array.<YearlyPlanIPV2>} data.body - Update - Yearly Plan
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.put('/ipv/:entity_regency_id/:year', yearlyIPVControllerV1.update)

/**
 * POST yearly plan result data
 * @route POST /v2/yearly-plan/result/{entity_regency_id}/{year}
 * @param {integer} entity_regency_id.path - entity_regency_id
 * @param {string} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.post('/result/:entity_regency_id/:year', yearlyResultControllerV1.submit)

yearlyPlanRouter.post('/askAproval/:entity_regency_id/:year', yearlyResultControllerV1.askApproval)

yearlyPlanRouter.post('/revision/:entity_regency_id/:year', yearlyResultControllerV1.revision)

yearlyPlanRouter.post('/approve/:entity_regency_id/:year', yearlyResultControllerV1.approve)

/**
 * GET yearly plan result data
 * @route GET /v2/yearly-plan/result/{entity_regency_id}/{year}
 * @param {integer} entity_regency_id.path - entity_regency_id
 * @param {string} year.path - year
 * @param {integer} material_id.query - Material ID
 * @param {integer} activity_id.query - Activity ID
 * @param {integer} entity_id.query - Entity ID
 * @group Yearly Plan - Operations about transaction type
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/result/:entity_regency_id/:year', yearlyResultControllerV2.detail)

/**
 * GET yearly plan result data xls
 * @route GET /v2/yearly-plan/result/{entity_regency_id}/{year}/xls
 * @param {integer} entity_regency_id.path - entity_regency_id
 * @param {string} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/result/:entity_regency_id/:year/xls', yearlyResultControllerV2.exportExcel)

yearlyPlanRouter.get('/list/', yearlyPlanController.list)

/**
 * POST generate min max for annual plan
 * @route POST /v2/yearly-plan/generate-min-max
 * @body {object} entities - {
 *   "year": 2022,
 *   "entities": [
 *     34724,
 *     25673
 *   ]
 * }
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[]}, {"deviceType": []}]
 */
yearlyPlanRouter.post(
  '/generate-min-max',
  validate(yearlyPlanValidator.generateMixMax),
  yearlyMinMaxController.generate)

export default yearlyPlanRouter
