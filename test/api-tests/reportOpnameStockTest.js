/* eslint-disable no-undef */
// import { testUserData, returnUser } from './helper'
import { USER_ROLE } from '../../app/helpers/constants'
import { crudTestSchema } from '../templates/templateTest'

// const timestamp = Date.now()

const returnBar = {
  intervalPeriod: 'object',
  overview: [{
    label: 'string',
    value: 'number',
  }],
  column: [{
    label: 'string',
  }],
  subColumn: 'object',
}

const returnTable = {
  month: 'string',
  intervalPeriod: 'object',
  total: 'number',
  page: 'number',
  perPage: 'number',
  list: [{
    id: 'number',
    name: 'string',
    total_active_days: 'number',
    total_inactive_days: 'number',
    total_frequency: 'number',
    average_frequency: 'number',
    overview: 'object',
  }],
}

const invalidHeaders = [
  { field: 'Authorization', schema: ['expired_token'], res_code: '401' },
  { field: 'auth', schema: ['empty', 'invalid_token'], res_code: '401' },
  { field: 'Authorization', schema: ['invalid_token'], res_code: '400' },
]

const testSchema = [
  {
    title: 'GET /stock/opname_stocks/bar_report',
    endpoint: '/stock/opname_stocks/bar_report',
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnBar,
  },
  {
    title: 'GET /stock/opname_stocks/entity_report',
    endpoint: '/stock/opname_stocks/entity_report',
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnTable,
  },
  {
    title: 'GET /stock/opname_stocks/entity_report/xls',
    endpoint: '/stock/opname_stocks/entity_report/xls',
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnTable,
  },
]

describe('Report Opname Stock Test', () => {
  crudTestSchema({
    testSchema,
  })
})
