/* eslint-disable no-undef */

import { USER_ROLE } from '../../app/helpers/constants'
import { crudTestSchema } from '../templates/templateTest'

const timestamp = Date.now()

const payloadChildReason = {
  title: `test_${timestamp}`,
  parent_id: 1,
}

const returnRules = {
  id: 'number',
  parent_id: 'number',
  title: 'string',
}

const invalidHeaders = [
  { field: 'Authorization', schema: ['expired_token'], res_code: '401' },
  { field: 'auth', schema: ['empty', 'invalid_token'], res_code: '401' },
  { field: 'Authorization', schema: ['invalid_token'], res_code: '400' },
]

const invalidBodySchema = []

const testSchema = [
  {
    title: 'POST /order/event-report-child-reason',
    endpoint: '/order/event-report-child-reason',
    method: 'post',
    body: payloadChildReason,
    invalidSchema: invalidBodySchema,
    invalidHeaders,
    success_code: '201',
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'GET /order/event-report-child-reason',
    endpoint: '/order/event-report-child-reason/',
    useID: true,
    method: 'get',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'DELETE /order/event-report-child-reason',
    endpoint: '/order/event-report-child-reason/',
    useID: true,
    method: 'delete',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'GET /order/event-report-child-reasons',
    endpoint: '/order/event-report-child-reasons',
    isList: true,
    method: 'get',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
]

describe('Laporan Kejadian Child Reason Test', () => {
  crudTestSchema({
    testSchema,
  })
})
