/* eslint-disable no-undef */
// import { testUserData, returnUser } from './helper'
import moment from 'moment'
import { EVENT_REPORT_STATUS, USER_ROLE } from '../../app/helpers/constants'
import { crudTestSchema } from '../templates/templateTest'
import { invalidField } from '../config'
import { flowStatusUpdate, allStatuses } from '../../app/helpers/eventReportHelper'

const eventReportItems = []
const invalidItems = []
const invalidReasonItems = []
const today = moment().format('YYYY-MM-DD')
const tomorrow = moment().add(1, 'days').format('YYYY-MM-DD')

eventReportItems.push({
  material_id: 9,
  no_batch: '00000',
  expired_date: moment().add(10, 'days').format('YYYY-MM-DD'),
  production_date: moment().subtract(10, 'days').format('YYYY-MM-DD'),
  qty: 99,
  reason_id: 1,
  child_reason_id: 1,
})

invalidItems.push({
  material_id: 9,
  no_batch: null,
  expired_date: null,
  production_date: null,
  qty: 99,
  reason_id: 1,
  child_reason_id: 1,
})

invalidReasonItems.push({
  material_id: 9,
  no_batch: '00000',
  expired_date: moment().add(10, 'days').format('YYYY-MM-DD'),
  production_date: moment().subtract(10, 'days').format('YYYY-MM-DD'),
  qty: 99,
  reason_id: null,
  child_reason_id: null,
})

const diffMaterials = JSON.parse(JSON.stringify(eventReportItems))
diffMaterials[0].material_id = 10
const diffMaterialItems = [
  ...eventReportItems,
  ...diffMaterials,
]

const payloadGeneral = {
  entity_id: 1,
  arrived_date: moment().format('YYYY-MM-DD'),
  items: eventReportItems,
  comments: [
    { comment: 'Test comment' },
  ],
}

const payloadNoOrder = {
  has_order: 0,
  no_packing_slip: '99999',
  ...payloadGeneral,
}

const payloadWithOrder = {
  has_order: 1,
  order_id: '1',
  ...payloadGeneral,
}

const returnRules = {
  id: 'number',
  status: 'number',
  status_label: 'string',
  order_id: 'number',
  entity_id: 'number',
  has_order: 'number',
  no_packing_slip: 'string',
  created_by: 'number',
  created_at: 'string',
  updated_at: 'string',
  updated_by: 'number',
  arrived_date: 'string',
  finished_at: 'string',
  finished_by: 'number',
  canceled_at: 'string',
  canceled_by: 'number',
  entity: {
    id: 'number',
    name: 'string',
  },
  items: [
    {
      material_id: 'number',
      material: {
        id: 'number',
        name: 'string',
      },
      no_batch: 'string',
      expired_date: 'string',
      production_date: 'string',
      qty: 'number',
      reason_id: 'number',
      reason: {
        id: 'number',
        title: 'string',
      },
      child_reason_id: 'number',
      child_reason: {
        id: 'number',
        title: 'string',
      },
    },
  ],
  comments: [
    {
      id: 'number',
      comment: 'string',
      user: {
        id: 'number',
        firstname: 'string',
        lastname: 'string',
        username: 'string',
      },
    },
  ],
}

const historyRules = {
  event_report_id: 'number',
  status: 'number',
  label: 'string',
  updated_at: 'string',
  updated_by: 'number',
  user_updated_by: {
    id: 'number',
    firstname: 'string',
    lastname: 'string',
  },
}

const invalidHeaders = [
  { field: 'Authorization', schema: ['expired_token'], res_code: '401' },
  { field: 'auth', schema: ['empty', 'invalid_token'], res_code: '401' },
  { field: 'Authorization', schema: ['invalid_token'], res_code: '400' },
]

const invalidNoOrderSchema = [
  { field: 'entity_id', schema: [invalidField.empty, invalidField['not exists'], invalidField['not int']] },
  { field: 'has_order', schema: [invalidField.empty, invalidField['not int']] },
  { field: 'no_packing_slip', schema: [invalidField.not_string] },
  { field: 'arrived_date', schema: [invalidField.empty, invalidField.invalid_date, invalidField.not_string] },
  { field: 'items', schema: [invalidItems, invalidReasonItems, diffMaterialItems] },
]

const invalidLinkSchemas = [
  { field: 'link', schema: [invalidField.empty, invalidField.not_string, invalidField.date] },
]

// payloadWithOrder
const updateStatusSchema = [
  { role: USER_ROLE.SUPERADMIN, status: EVENT_REPORT_STATUS.ON_CHECK_VCCM },
  { role: USER_ROLE.SUPERADMIN, status: EVENT_REPORT_STATUS.UPDATE_BIOFARMA },
  { role: USER_ROLE.CONTACT_CENTER, status: EVENT_REPORT_STATUS.BIOFARMA_INSPECTION },
  { role: USER_ROLE.CONTACT_CENTER, status: EVENT_REPORT_STATUS.ALREADY_REVISION },
  { role: USER_ROLE.SUPERADMIN, status: EVENT_REPORT_STATUS.VALIDATE_REVISION },
  { role: USER_ROLE.MANAGER, status: EVENT_REPORT_STATUS.FINISH },
]

// make a test from update status
const testEventReportStatus = []
updateStatusSchema.forEach((flow) => {
  const { status, role } = flow
  const configFlow = flowStatusUpdate.find((el) => el.status === flow.status)
  const invalidStatus = allStatuses.filter((el) => configFlow.nextStatus.indexOf(el) < 0)
  const listStatus = {
    title: `GET /order/event-report/:id/statuses before ${status}`,
    endpoint: '/order/event-report/:id/statuses',
    useParam: 'id',
    method: 'get',
    isList: true,
    isPaginate: false,
    invalidHeaders,
    returnRules: { status: 'number', label: 'string' },
    roleID: role,
    updateData: false,
  }
  const updateStatus = {
    title: `POST /order/event-report/:id/status to ${status}`,
    endpoint: '/order/event-report/:id/status',
    useParam: 'id',
    body: { status, comment: `Update ${status}` },
    invalidSchema: [{ field: 'status', schema: invalidStatus }],
    method: 'post',
    invalidHeaders,
    returnRules: { message: 'string' },
    roleID: role,
    updateData: false,
  }
  testEventReportStatus.push(listStatus)
  testEventReportStatus.push(updateStatus)
})

const testSchema = [
  {
    title: 'POST /order/event-report no order',
    endpoint: '/order/event-report',
    method: 'post',
    body: payloadNoOrder,
    invalidSchema: invalidNoOrderSchema,
    invalidHeaders,
    success_code: '201',
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  {
    title: 'GET /order/event-report',
    endpoint: '/order/event-report/',
    useID: true,
    method: 'get',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
  },
  ...testEventReportStatus,
  {
    title: 'POST /order/event-report/:id/link',
    endpoint: '/order/event-report/:id/link',
    useParam: 'id',
    method: 'post',
    body: { link: 'http://google.com' },
    invalidHeaders,
    invalidSchema: invalidLinkSchemas,
    returnRules: { message: 'string' },
    roleID: USER_ROLE.SUPERADMIN,
    updateData: false,
  },
  {
    title: 'GET /order/event-report/:id/histories',
    endpoint: '/order/event-report/:id/histories',
    useParam: 'id',
    method: 'get',
    isList: true,
    isPaginate: false,
    invalidHeaders,
    returnRules: historyRules,
    roleID: USER_ROLE.SUPERADMIN,
    updateData: false,
  },
  {
    title: 'GET /order/event-reports/xls',
    endpoint: '/order/event-reports/xls',
    method: 'get',
    invalidHeaders,
    roleID: USER_ROLE.SUPERADMIN,
    updateData: false,
  },
  {
    title: 'GET /order/event-reports',
    endpoint: '/order/event-reports',
    method: 'get',
    invalidHeaders,
    returnRules,
    roleID: USER_ROLE.SUPERADMIN,
    updateData: false,
    filterQueries: [
      { query: 'material_id', querySchema: [9, 10] },
      { query: 'from_arrived_date', querySchema: [today], property: 'arrived_date' },
      { query: 'to_arrived_date', querySchema: [tomorrow], property: 'arrived_date' },
      { query: 'updated_at', querySchema: [today] },
      { query: 'order_id', querySchema: ['data_created.order_id'] },
      { query: 'status', querySchema: ['data_created.status'] },
      { query: 'entity_id', querySchema: ['data_created.entity_id'] },
      { query: 'province_id', querySchema: ['data_created.province_id'] },
      { query: 'regency_id', querySchema: ['data_created.regency_id'] },
      // { query: 'entity_tag_ids', querySchema: ['data_created.arrived_date'] },
    ],
    isList: true,
    isPaginate: true,
  },
  {
    title: 'GET /order/event-report-statuses',
    endpoint: '/order/event-report-statuses',
    method: 'get',
    isList: true,
    isPaginate: false,
    invalidHeaders,
    returnRules: { status: 'number', count: 'number', label: 'string' },
    roleID: USER_ROLE.SUPERADMIN,
    updateData: false,
  },
]

describe('Laporan Kejadian Test', () => {
  crudTestSchema({
    testSchema,
  })
})
