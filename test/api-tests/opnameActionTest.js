/* eslint-disable no-undef */
// import { testUserData, returnUser } from './helper'
import { USER_ROLE } from '../../app/helpers/constants'
import { crudTestSchema } from '../templates/templateTest'

const timestamp = Date.now()

const testPayload = {
  title: `test_${timestamp}`,
}

const returnRules = {
  id: 'number',
  title: 'string',
  updated_by: 'number',
  created_at: 'string',
  updated_at: 'string',
}

const invalidHeaders = [
  { field: 'Authorization', schema: ['expired_token'], res_code: '401' },
  { field: 'auth', schema: ['empty', 'invalid_token'], res_code: '401' },
  { field: 'Authorization', schema: ['invalid_token'], res_code: '400' },
]

// let invalidBodySchema = [
//   {field: 'title', schema: ['empty', 'not_string']},
// ]
const createBody = testPayload

const testSchema = [
  {
    title: 'POST /stock/opname_action',
    endpoint: '/stock/opname_action',
    method: 'post',
    body: createBody,
    // invalidSchema: invalidBodySchema,
    invalidHeaders,
    success_code: '201',
    updateField: { title: 'create_' },
    returnRules,
  },
  {
    title: 'PUT /stock/opname_action',
    endpoint: '/stock/opname_action/',
    useID: true,
    method: 'put',
    body: createBody,
    // invalidSchema: invalidBodySchema,
    invalidHeaders,
    updateField: { title: 'update_' },
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'GET /stock/opname_action',
    endpoint: '/stock/opname_action/',
    useID: true,
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'GET /stock/opname_actions',
    endpoint: '/stock/opname_actions',
    isList: true,
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'DELETE /stock/opname_action',
    endpoint: '/stock/opname_action/',
    useID: true,
    method: 'delete',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
]

describe('Opname Reason Test', () => {
  crudTestSchema({
    testSchema,
  })
})
