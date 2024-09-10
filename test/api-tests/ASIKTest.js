/* eslint-disable no-undef */
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'

import { USER_ROLE } from '../../app/helpers/constants'
import { crudTestSchema } from '../templates/templateTest'
import { getToken } from '../helpers/helper'
import app from '../../app/app'
import moment from 'moment'

chai.use(chaiHttp)
chai.should()

const token = []
const timestamp = Date.now()
const random = Math.floor(Math.random() * (1000 - 1)) + 1
const roleID = USER_ROLE.SUPERADMIN

const returnInvalid = {
  message: 'string',
}

const returnEntities = {
  total: 'number',
  page: 'number',
  perPage: 'number',
  list: [{
    id: 'number',
  }],
}

const returnTable = {
  total: 'number',
  page: 'number',
  perPage: 'number',
  list: [{
    id: 'number',
    vendor: 'object',
    customer: 'object',
    activity: 'object',
    material: 'object',
  }],
}

const invalidHeaders = [
  { field: 'Authorization', schema: ['expired_token'], res_code: '401' },
  { field: 'auth', schema: ['empty', 'invalid_token'], res_code: '401' },
  { field: 'Authorization', schema: ['invalid_token'], res_code: '400' },
]

let vendorId = 5
let customerId = 111

const createBody = {
  vendor_id: vendorId,
  customer_id: customerId,
  activity_id: 1,
  material_id: 31,
  stock_id: 107765,
  status_vvm: null,
  consumed_qty: 200,
  consumed_qty_openvial: 100,
  consumed_qty_closevial: 100
}

let transactionBody = [
  {
    'transaction_type_id': 2,
    'transaction_reason_id': null,
    'other_reason': null,
    'status_id': null,
    'entity_id': 5,
    'material_id': 31,
    'activity_id': 7,
    'stock_id': 107765,
    'customer_id': 111,
    'dose_1': null,
    'dose_2': null,
    'booster': null,
    'open_vial': 10,
    'close_vial': 120,
    'created_at': '2022-04-15T07:01:19Z',
    'is_batches': true,
    'batch': {
      'code': '5010619',
      'expired_date': '2023-11-29T16:59:59.000Z',
      'manufacture_id': 1
    }
  }
]

const testSchema = [
  {
    title: 'GET /integration/ayo-sehat/entities',
    endpoint: '/integration/ayo-sehat/entities',
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnEntities,
  },
  {
    title: 'POST /v2/transactions',
    endpoint: '/v2/transactions',
    method: 'post',
    body: transactionBody,
    invalidHeaders,
    success_code: '201',
    // returnRules,
  },
  {
    title: 'POST /integration/ayo-sehat/consumption',
    endpoint: `/integration/ayo-sehat/consumption/${customerId}`,
    method: 'post',
    body: createBody,
    invalidHeaders,
    success_code: '201',
    // returnRules,
  },
  {
    title: 'GET /integration/ayo-sehat/consumption',
    endpoint: '/integration/ayo-sehat/consumption',
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    returnTable,
  },
]

describe('Integration with ASIK POST', async() => {
  crudTestSchema({
    testSchema,
  })
})

describe('Integration with ASIK PUT', async() => {
  token[roleID] = await getToken(roleID)
  const endpoint = '/integration/ayo-sehat/consumption'
  chai.request(app)['get'](endpoint)
    .set('Authorization', token[roleID])
    .end((err, res) => {
      res.body.list.forEach((listItem) => {
        let returnConsumption = {
          return_qty_openvial: 5,
          return_qty_closevial: 1,
          injection_qty: random,
          injection_date: moment()
        }
        const ayosehatId = listItem.id
        const testPutSchema = [
          {
            title: 'PUT Accept Consumption SUCCESS',
            endpoint: `/integration/ayo-sehat/consumption/${customerId}/accept/${ayosehatId}`,
            method: 'put',
            body: { session_id: 'sess_'+random, consumed_status: 1 },
            invalidHeaders,
            success_code: '200',
          },
          {
            title: 'PUT Return Consumption SUCCESS',
            endpoint: `/integration/ayo-sehat/consumption/${customerId}/return/${ayosehatId}`,
            method: 'put',
            body: returnConsumption,
            invalidHeaders,
            success_code: '200',
          },
          {
            title: 'PUT Return Consumption Accept SUCCESS',
            endpoint: `/integration/ayo-sehat/consumption/${customerId}/accept/${ayosehatId}/accept`,
            method: 'put',
            body: { return_status: 1 },
            invalidHeaders,
            success_code: '200',
          },
        ]
        crudTestSchema({
          testPutSchema,
        })
      })
    })
})