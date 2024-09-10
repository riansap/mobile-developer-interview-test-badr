/* eslint-disable no-undef */
// import { testUserData, returnUser } from './helper'
import moment from 'moment'
import { USER_ROLE, OPNAME_CATEGORY } from '../../app/helpers/constants'
import { crudTestSchema } from '../templates/templateTest'
import { invalidField } from '../config'

// const timestamp = Date.now()

const opnameItems = []
Object.keys(OPNAME_CATEGORY).forEach((key) => {
  opnameItems.push({
    stock_category: OPNAME_CATEGORY[key],
    stock_category_label: String(key),
    smile_qty: 100,
    real_qty: 100,
    reasons: [
      { id: 1, title: 'Rusak' },
    ],
    actions: [
      { id: 1, title: 'Aksi' },
    ],
  })
})

const testPayload = {
  // 'title': `test_${timestamp}`,
  material_id: 1,
  entity_id: 1,
  start_date: moment().format('YYYY-MM-DD'),
  end_date: moment().format('YYYY-MM-DD'),
  opname_stock_items: opnameItems,
}

const returnRules = {
  id: 'number',
  material_id: 'number',
  entity_id: 'number',
  created_by: 'number',
  created_at: 'string',
  updated_at: 'string',
  start_date: 'string',
  end_date: 'string',
  entity: {
    id: 'number',
    name: 'string',
  },
  material: {
    id: 'number',
    name: 'string',
  },
  user_created_by: {
    id: 'number',
    firstname: 'string',
  },
  opname_stock_items: [
    {
      stock_category: 'number',
      stock_category_label: 'string',
      smile_qty: 'number',
      real_qty: 'number',
      reasons: 'object',
      actions: 'object',
    },
  ],
}

const invalidHeaders = [
  { field: 'Authorization', schema: ['expired_token'], res_code: '401' },
  { field: 'auth', schema: ['empty', 'invalid_token'], res_code: '401' },
  { field: 'Authorization', schema: ['invalid_token'], res_code: '400' },
]

const invalidOpnameItemSchema = {
  smileQtyRealQtyNotSame: [
    {
      stock_category: 1,
      stock_category_label: 'Test',
      smile_qty: 1,
      real_qty: 100,
      reasons: [],
      actions: [],
    },
  ],
  actionReasonNotSame: [
    {
      stock_category: 1,
      stock_category_label: 'Test',
      smile_qty: 100,
      real_qty: 100,
      reasons: [
        { id: 1, title: 'Rusak' },
        { id: 2, title: 'Gaada Barang' },
      ],
      actions: [
        { id: 1, title: 'Aksi' },
      ],
    },
  ],

}

const invalidBodySchema = [
  { field: 'material_id', schema: [invalidField.empty, invalidField['not exists'], invalidField['not int']] },
  { field: 'entity_id', schema: [invalidField.empty, invalidField['not exists'], invalidField['not int']] },
  { field: 'start_date', schema: [invalidField.empty, invalidField.invalid_date, invalidField.not_string] },
  { field: 'end_date', schema: [invalidField.empty, invalidField.invalid_date, invalidField.not_string] },
  { field: 'opname_stock_items', schema: [invalidOpnameItemSchema.smileQtyRealQtyNotSame, invalidOpnameItemSchema.actionReasonNotSame] },
]
const createBody = testPayload

const testSchema = [
  {
    title: 'POST /stock/opname_stock',
    endpoint: '/stock/opname_stock',
    method: 'post',
    body: createBody,
    invalidSchema: invalidBodySchema,
    invalidHeaders,
    success_code: '201',
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'GET /stock/opname_stock',
    endpoint: '/stock/opname_stock/',
    useID: true,
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'GET /stock/opname_stocks',
    endpoint: '/stock/opname_stocks',
    isList: true,
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'GET /stock/opname_stocks/xls',
    endpoint: '/stock/opname_stocks/xls',
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
]

describe('Opname Stock Test', () => {
  crudTestSchema({
    testSchema,
  })
})
