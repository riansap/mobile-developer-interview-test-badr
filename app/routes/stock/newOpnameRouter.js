import express from 'express'
import parameterModel from '../../helpers/parameterModel'
import { detail } from '../../controllers/commonController'
import * as newOpnameController from '../../controllers/newOpname/newOpnameController'
import * as newOpnameValidator from '../../validators/newOpnameValidator'
import { validate } from '../../validators'

const newOpnameRouter = express.Router()

/* GET new_opnames listing. */
/**
 * GET list new_opnames
 * @route GET /stock/new-opnames
 * @group New Opname - Operations about New Opnames
 * @param {integer} entity_id.query - entity_id
 * @param {integer} material_id.query - material_id
 * @param {string} batch_code.query - batch_code
 * @param {string} expired_from.query - expired_from
 * @param {string} expired_to.query - expired_to
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {integer} province_id.query - province_id
 * @param {integer} regency_id.query - regency_id
 * @param {integer} entity_id.query - entity_id
 * @param {integer} entity_tag_id.query - entity_tag_id
 * @param {integer} only_have_qty.query - only_have_qty
 * @returns {object} 200 - {
 * list: [
 *    {
 *      id: 1,
 *      entity_id: 1,
 *      entity: {},
 *      material_id: 1,
 *      material: {},
 *      batch_code: 'AAA',
 *      expired_date: '20200101',
 *      smile_qty: 0,
 *      real_qty: 0,
 *      unsubmit_distribution_qty: 0,
 *      unsubmit_return_qty: 0,
 *      updated_at: '20200101',
 *      created_at: '20200101',
 *      updated_by: 1,
 *      created_by_user: {},
 *    },
 * ],
 * page: 1,
 * perPage: 10,
 * total: 100
 * }
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET new_opnames listing. */
/**
 * GET list new_opnames
 * @route GET /stock/new-opnames/xls
 * @group New Opname - Operations about New Opnames
 * @param {integer} entity_id.query - entity_id
 * @param {integer} material_id.query - material_id
 * @param {string} batch_code.query - batch_code
 * @param {string} expired_from.query - expired_from
 * @param {string} expired_to.query - expired_to
 * @param {string} created_from.query - created_from
 * @param {string} created_to.query - created_to
 * @param {integer} province_id.query - province_id
 * @param {integer} regency_id.query - regency_id
 * @param {integer} entity_id.query - entity_id
 * @param {integer} entity_tag_id.query - entity_tag_id
 * @param {integer} only_have_qty.query - only_have_qty
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */

/* GET new-opname material detail. */
/**
 * GET detail new-opname
 * @route GET /stock/new-opname/{id}
 * @group New Opname - Operations about New Opname
 * @param {id} id.path - id new-opname
 * @returns {object} 200 - {
 *   id: 1
 *   entity_id: 31
 *   entity: { name: 'Jawa Barat' },
 *   updated_at: "20211215T04:49:57.000Z",
 *   created_at: "20211215T04:49:57.000Z"
 *   updated_by: 1
 *   created_by: 1
 *   user_updated_by: { id: 1, username: 'tes' },
 *   user_created_by: { id: 1, username: 'tes' },
 *   new_opname_items: [
 *   { id: 1,
 *     new_opname_id: 1,
 *     material_id: 1,
 *     material: { name: 'example', is_batch: false },
 *     created_at: "20211215T04:49:57.000Z",
 *     updated_at: "20211215T04:49:57.000Z",
 *     deleted_at: "20211215T04:49:57.000Z",
 *     new_opname_stocks: [
 *     { id: 1,
 *       new_opname_item_id: 1,
 *       stock_id: 1,
 *       batch_id: 1,
 *       batch_code: 'AAA',
 *       expired_at: "20211215T04:49:57.000Z",
 *       smile_qty: 0,
 *       real_qty: 0,
 *       unsubmit_distribution_qty: 0,
 *       unsubmit_return_qty: 0,
 *       created_at: "20211215T04:49:57.000Z",
 *       updated_at: "20211215T04:49:57.000Z"
 *       deleted_at: "20211215T04:49:57.000Z"
 *     }
 *     ]
 *   },
 *   ]
 * }
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
newOpnameRouter.get(
  '/:id',
  parameterModel.define('NewOpname'),
  detail,
)

/* NewOpname Model. */
/**
 * @typedef NewOpnameForm
 * @property {integer} entity_id.required - 1 - Entity id - eg:1
 * @property {Array.<NewOpnameItem>} new_opname_items -
 */

/* NewOpnameItem Model. */
/**
 * @typedef NewOpnameItem
 * @property {integer} material_id - 1 - Material id (nullable) - eg:1
 * @property {Array.<NewOpnameStock>} new_opname_stocks -
 */

/* NewOpnameStock Model. */
/**
 * @typedef NewOpnameStock
 * @property {integer} stock_id - 1 - Stock ID (nullable) - eg:1
 * @property {integer} batch_id - 0 - Batch ID (0/1) - eg:1
 * @property {string} batch_code - 1 - Batch Code - eg:AAAA
 * @property {string} expired_date - Expired Date - eg:2020-12-31
 * @property {integer} smile_qty.required - 0 - Smile Qty - eg:0
 * @property {integer} real_qty.required - 0 - Real Qty - eg:0
 * @property {integer} unsubmit_distribution_qty.required - unsubmit_distribution_qty - eg:0
 * @property {integer} unsubmit_return_qty.required - unsubmit_return_qty - eg:0
 */

/* POST new-opname material listing. */
/**
 * POST new new-opname
 * @route POST /stock/new-opname
 * @group New Opname - Operations about New Opname
 * @param {NewOpnameForm.model} data.body create - new-opname
 * @returns {object} 201 - [
 * ]
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
newOpnameRouter.post(
  '/',
  validate(newOpnameValidator.create),
  newOpnameController.create,
)

export default newOpnameRouter
