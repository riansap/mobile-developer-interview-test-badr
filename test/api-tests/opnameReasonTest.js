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
    title: 'POST /stock/opname_reason',
    endpoint: '/stock/opname_reason',
    method: 'post',
    body: createBody,
    // invalidSchema: invalidBodySchema,
    invalidHeaders,
    success_code: '201',
    updateField: { title: 'create_' },
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'PUT /stock/opname_reason',
    endpoint: '/stock/opname_reason/',
    useID: true,
    method: 'put',
    body: createBody,
    // invalidSchema: invalidBodySchema,
    invalidHeaders,
    updateField: { title: 'update_' },
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'GET /stock/opname_reason',
    endpoint: '/stock/opname_reason/',
    useID: true,
    method: 'get',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'DELETE /stock/opname_reason',
    endpoint: '/stock/opname_reason/',
    useID: true,
    method: 'delete',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'GET /stock/opname_reasons',
    endpoint: '/stock/opname_reasons',
    isList: true,
    method: 'get',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
]

describe('Opname Reason Test', () => {
  crudTestSchema({ testSchema })
})
