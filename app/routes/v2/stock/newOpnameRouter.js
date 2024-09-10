import express from 'express'
import parameterModel from '../../../helpers/parameterModel'
import { detail } from '../../../controllers/commonController'
import * as newOpnameController from '../../../controllers/v2/newOpname/newOpnameController'
import * as newOpnameValidator from '../../../validators/v2/newOpnameValidator'
import { validate } from '../../../validators'

const newOpnameRouter = express.Router()

/**
 * GET list new_opnames
 * @route GET /v2/stock/new-opnames
 * @group New Opname V2 - Operations about New Opnames
 * @param {integer} entity_id.query - entity_id
 * @param {integer} activity_id.query - activity_id
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
 *      activity_id: 1,
 *      activity: {},
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

/**
 * GET XLS new_opnames
 * @route GET /v2/stock/new-opnames/xls
 * @group New Opname V2 - Operations about New Opnames
 * @param {integer} entity_id.query - entity_id
 * @param {integer} activity_id.query - activity_id
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

/**
 * GET detail new-opname
 * @route GET /v2/stock/new-opname/{id}
 * @group New Opname V2 - Operations about New Opname
 * @param {id} id.path - id new-opname
 * @returns {object} 200 - {
 *   id: 1
 *   entity_id: 31
 *   entity: { name: 'Jawa Barat' },
 *   activity_id: 1,
 *   activity: { id: 1, name: 'Rutin' }, 
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
 * @typedef NewOpnameForm2
 * @property {integer} entity_id.required - 1 - Entity id - eg:1
 * @property {integer} activity_id.required - 1 - Activity ID - eg:1
 * @property {Array.<NewOpnameItem>} new_opname_items -
 */

/**
 * POST Create new-opname
 * @route POST /v2/stock/new-opname
 * @group New Opname V2 - Operations about New Opname
 * @param {NewOpnameForm2.model} data.body create - new-opname
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
