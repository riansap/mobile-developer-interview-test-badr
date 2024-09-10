/* eslint-disable no-undef */
// import { testUserData, returnUser } from './helper'
import { USER_ROLE } from '../../app/helpers/constants'
import { crudTestSchema } from '../templates/templateTest'
// import { invalidField } from '../config'

const timestamp = Date.now()
const testPayload = {
  title: `test_${timestamp}`,
}

const returnRules = {
  id: 'number',
  title: 'string',
}

const invalidHeaders = [
  { field: 'Authorization', schema: ['expired_token'], res_code: '401' },
  { field: 'auth', schema: ['empty', 'invalid_token'], res_code: '401' },
  { field: 'Authorization', schema: ['invalid_token'], res_code: '400' },
]

const invalidBodySchema = [
  // { field: 'title', schema: [invalidField.empty, invalidField['not string']] },
]
const createBody = testPayload

const testSchema = [
  {
    title: 'POST /order/event-report-reason',
    endpoint: '/order/event-report-reason',
    method: 'post',
    body: createBody,
    invalidSchema: invalidBodySchema,
    invalidHeaders,
    success_code: '201',
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'GET /order/event-report-reason',
    endpoint: '/order/event-report-reason/',
    useID: true,
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
  {
    title: 'DELETE /order/event-report-reason',
    endpoint: '/order/event-report-reason/',
    useID: true,
    method: 'delete',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'GET /order/event-report-reasons',
    endpoint: '/order/event-report-reasons',
    isList: true,
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnRules,
  },
]

describe('Laporan Kejadian Reason Test', () => {
  crudTestSchema({
    testSchema,
  })
})
