import moment from 'moment'
import { EVENT_REPORT_STATUS, USER_ROLE, getLabelByKey } from './constants'
import { leadZeroNumber } from './common'

export const allStatuses = [
  EVENT_REPORT_STATUS.CREATE,
  EVENT_REPORT_STATUS.ON_CHECK_VCCM,
  EVENT_REPORT_STATUS.CANCEL,
  EVENT_REPORT_STATUS.UPDATE_BIOFARMA,
  EVENT_REPORT_STATUS.UPDATE_MANUAL,
  EVENT_REPORT_STATUS.BIOFARMA_INSPECTION,
  EVENT_REPORT_STATUS.ALREADY_REVISION,
  EVENT_REPORT_STATUS.VALIDATE_REVISION,
  EVENT_REPORT_STATUS.FINISH,
]

export function getLeadTime(eventReport) {
  const startDate = eventReport.created_at
  let endDate = null
  if (eventReport.status === EVENT_REPORT_STATUS.FINISH) endDate = eventReport.finished_at
  if (eventReport.status === EVENT_REPORT_STATUS.CANCEL) endDate = eventReport.canceled_at
  const start = moment(startDate)
  const end = endDate ? moment(endDate) : moment()

  const duration = moment.duration(end.diff(start))
  const hours = parseInt(duration.asHours())
  const minutes = parseInt(duration.asMinutes()) % 60
  const seconds = parseInt(duration.asSeconds()) % 60 % 60

  const formatTime = `${hours}:${leadZeroNumber(minutes)}:${leadZeroNumber(seconds)}`
  return formatTime
}

const allStepStatus = [EVENT_REPORT_STATUS.CANCEL]
export const flowStatusUpdate = [
  {
    status: EVENT_REPORT_STATUS.CREATE,
    roles: [USER_ROLE.MANAGER, USER_ROLE.MANAGER_COVID],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.ON_CHECK_VCCM,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.ON_CHECK_VCCM,
    roles: [USER_ROLE.SUPERADMIN],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.UPDATE_BIOFARMA,
      EVENT_REPORT_STATUS.UPDATE_MANUAL,
      EVENT_REPORT_STATUS.UPDATE_PFIZER,
      EVENT_REPORT_STATUS.UPDATE_PROVINCE,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.UPDATE_BIOFARMA,
    roles: [USER_ROLE.SUPERADMIN],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.UPDATE_MANUAL,
      EVENT_REPORT_STATUS.BIOFARMA_INSPECTION,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.UPDATE_PROVINCE,
    roles: [USER_ROLE.SUPERADMIN],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.UPDATE_MANUAL,
      EVENT_REPORT_STATUS.BIOFARMA_INSPECTION,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.UPDATE_PFIZER,
    roles: [USER_ROLE.SUPERADMIN],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.UPDATE_MANUAL,
      EVENT_REPORT_STATUS.BIOFARMA_INSPECTION,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.BIOFARMA_INSPECTION,
    roles: [USER_ROLE.SUPERADMIN, USER_ROLE.CONTACT_CENTER],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.UPDATE_MANUAL,
      EVENT_REPORT_STATUS.ALREADY_REVISION,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.UPDATE_MANUAL,
    roles: [USER_ROLE.SUPERADMIN],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.FINISH,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.ALREADY_REVISION,
    roles: [USER_ROLE.SUPERADMIN, USER_ROLE.CONTACT_CENTER],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.VALIDATE_REVISION,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.VALIDATE_REVISION,
    roles: [USER_ROLE.SUPERADMIN],
    nextStatus: [
      ...allStepStatus,
      EVENT_REPORT_STATUS.FINISH,
    ],
  },
  {
    status: EVENT_REPORT_STATUS.CANCEL,
    roles: [USER_ROLE.SUPERADMIN, USER_ROLE.MANAGER, USER_ROLE.MANAGER_COVID],
    nextStatus: [],
  },
  {
    status: EVENT_REPORT_STATUS.FINISH,
    roles: [USER_ROLE.SUPERADMIN, USER_ROLE.MANAGER, USER_ROLE.MANAGER_COVID],
    nextStatus: [],
  },
]

export function getEventReportStatus(req, key) {
  const label = getLabelByKey(EVENT_REPORT_STATUS, key)
  return req.__(`field.event_report_status.${label.replace(' ', '_').toLowerCase()}`)
}
