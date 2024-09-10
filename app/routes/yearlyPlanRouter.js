import express from 'express'
import * as yearlyTargetController from '../controllers/yearlyTargetController'
import * as yearlyIPVController from '../controllers/yearlyIPVController'
import * as yearlyResultController from '../controllers/yearlyResultController'
import * as yearlyPlanController from '../controllers/yearlyPlanController'

const yearlyPlanRouter = express.Router()

/**
 * This function comment is parsed by doctrine
 * @route GET /yearly-plan/target/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @param {integer} entity_id.query - 1 - Entity ID (faskes)
 * @group Yearly Plan - Operations about yearly plan
 * @returns {YearlyPlan.model} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/target/:entity_regency_id/:year', yearlyTargetController.detail)


/* ParentPlan Model. */
/**
 * @typedef ParentPlan
 * @property {number} id.required - 1 - ID - eg:1
 * @property {string} name.required - 1 - Entity Name - eg:SUDINKES KOTA JAKARTA PUSAT
 * @property {Array.<Target>} targets - array object [{material_id: 1, ordered_qty: 100}]
 */

/* ChildPlan Model */
/**
 * @typedef ChildPlan
 * @property {integer} id.required - 1 - ID - eg:50
 * @property {string} name.required - 1 - Entity Name - eg:PUSKESMAS KEC. TANAH ABANG
 * @property {string} address - address - Alamat Entitas - eg:Alamat
 * @property {Array.<Target>} targets - array object [{material_id: 1, ordered_qty: 100}]
 */

/* Target Model. */
/**
 * @typedef Target
 * @property {integer} id.required - 1 - Target id - eg:1
 * @property {string} name.required - 1 - Target Name - eg:Bayi Lahir Hidup
 * @property {integer} propotion.required - 1 - Propotion - eg:0
 * @property {integer} qty - 1- Qty - eg:10000
 * @property {integer} custom_qty - 1- Custom Qty - eg:11000
 */

/* YearlyPlan Model. */
/**
 * @typedef YearlyPlan
 * @property {ParentPlan.model} parent 
 * @property {Array.<ChildPlan>} childs
 */

/**
 * Update target yearly plan
 * @route PUT /yearly-plan/target/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @param {YearlyPlan.model} data.body - Update - Yearly Plan
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.put('/target/:entity_regency_id/:year', yearlyTargetController.update)

/* YearlyPlanStep Model. */
/**
 * @typedef YearlyPlanStep
 * @property {integer} step - 1 - next Step[1,2,3,4] - eg:1
 */

/**
 * Submit step yearly plan form
 * @route PUT /yearly-plan/target/{entity_regency_id}/{year}/next
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
 * @route GET /yearly-plan/target/{entity_regency_id}/{year}/last-step
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
 * @typedef YearlyPlanIPV
 * @property {integer} id - 1 - Yearly Plan IPV id - eg:1
 * @property {integer} material_id - 1 - Material_id - eg:1
 * @property {integer} entity_id - 1 - Material_id - eg:1
 * @property {decimal} custom_ipv - 1 - Indeks pemakaian nasional final - eg:1,0
 * @property {integer} created_by - 1 - created_by - eg:1
 * @property {integer} updated_by - 1 - updated_by - eg:1
 * @property {MasterIPV.model} master_ipv
 */

/**
 * @typedef MasterIPV
 * @property {integer} id - 1 - Yearly Plan IPV id - eg:1
 * @property {decimal} ipv - 1 - Material_id - eg:1,0
 */

/**
 * Get yearly plan IPV data
 * @route GET /yearly-plan/ipv/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @param {integer} entity_id.query - 1 - Entity Id (Faskes)
 * @param {integer} page.query - 1- Page 
 * @param {integer} paginate.query - 1- Paginate 
 * @group Yearly Plan - Operations about transaction type
 * @returns {YearlyPlanIPV.model} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/ipv/:entity_regency_id/:year', yearlyIPVController.detail)

/**
 * POST yearly plan IPV data
 * @route PUT /yearly-plan/ipv/{entity_regency_id}/{year}
 * @param {entity_regency_id} entity_regency_id.path - entity_regency_id
 * @param {year} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @param {Array.<YearlyPlanIPV>} data.body - Update - Yearly Plan
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.put('/ipv/:entity_regency_id/:year', yearlyIPVController.update)

/**
 * POST yearly plan result data
 * @route POST /yearly-plan/result/{entity_regency_id}/{year}
 * @param {integer} entity_regency_id.path - entity_regency_id
 * @param {string} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.post('/result/:entity_regency_id/:year', yearlyResultController.submit)

/**
* POST yearly plan result data
* @route POST /yearly-plan/result/{entity_regency_id}/{year}
* @param {integer} entity_regency_id.path - entity_regency_id
* @param {string} year.path - year
* @group Yearly Plan - Operations about transaction type
* @returns {object} 200 - { }
* @returns {Error}  default - Unexpected error
* @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
*/
yearlyPlanRouter.post('/askAproval/:entity_regency_id/:year', yearlyResultController.askApproval)

yearlyPlanRouter.post('/revision/:entity_regency_id/:year', yearlyResultController.revision)

yearlyPlanRouter.post('/approve/:entity_regency_id/:year', yearlyResultController.approve)

/**
 * GET yearly plan result data
 * @route GET /yearly-plan/result/{entity_regency_id}/{year}
 * @param {integer} entity_regency_id.path - entity_regency_id
 * @param {string} year.path - year
 * @param {integer} material_id.query - Material ID
 * @param {integer} entity_id.query - Entity ID
 * @group Yearly Plan - Operations about transaction type
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/result/:entity_regency_id/:year', yearlyResultController.detail)

/**
 * GET yearly plan result data
 * @route GET /yearly-plan/result/{entity_regency_id}/{year}/xls
 * @param {integer} entity_regency_id.path - entity_regency_id
 * @param {string} year.path - year
 * @group Yearly Plan - Operations about transaction type
 * @returns {object} 200 - { }
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "JWT":[], "deviceType": []}]
 */
yearlyPlanRouter.get('/result/:entity_regency_id/:year/xls', yearlyResultController.exportExcel)

yearlyPlanRouter.get('/list/', yearlyPlanController.list)
 
export default yearlyPlanRouter
