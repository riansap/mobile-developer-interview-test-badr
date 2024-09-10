const morgan = require('morgan')
const moment = require('moment-timezone')

require('dotenv').config()

const customFormat = {
  timestamp: ':timestamp',
  path: ':raw-url',
  method: ':method',
  queryParams: ':url-query',
  remote: ':remote-addr',
  user: ':remote-user',
  code: ':status',
  size: ':res[content-length] B',
  response: ':res-body',
  error: ':err-response',
  agent: ':user-agent',
  responseTime: ':response-time',
  env: ':env',
  body: ':req-body',
  reqHeader: ':req[header]',
  resHeader: ':res[header]',
  requestID: ':request-id',
}

const simpleFormat = {
  timestamp: ':timestamp',
  remote: ':remote-addr',
  user: ':remote-user',
  method: ':method',
  path: ':url',
  code: ':status',
  size: ':res[content-length]',
  agent: ':user-agent',
  responseTime: ':response-time',
}


function escapeSpecialChars(string) {
  if (!string) return ''
  return string.replace(/[\\]/g, '\\\\')
    .replace(/[\"]/g, '\\\"')
    .replace(/[\/]/g, '\\/')
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t')
}

function addCustomToken(selectedMorgan) {
  selectedMorgan.token('timestamp', () => {
    const timestamp = moment().tz('Asia/Jakarta').format()
    return timestamp
  })
  selectedMorgan.token('res-body', (req, res) => {
    const string = res.resBody ? escapeSpecialChars(res.resBody) : res.statusMessage
    return string
  })
  selectedMorgan.token('err-response', (req, res) => {
    const errorMessage = res.locals.error && res.locals.error.stack ? res.locals.error.stack : ''
    // const errorMessage = res.locals.error.stack
    const err = escapeSpecialChars(errorMessage)
    return err
  })
  selectedMorgan.token('req-body', (req, res) => {
    const string = req.body ? escapeSpecialChars(JSON.stringify(req.body)) : ''
    return string
  })
  selectedMorgan.token('env', () => process.env.NODE_ENV)
  selectedMorgan.token('raw-url', (req, res) => {
    const parseUrl = req.url.split('?')
    return parseUrl[0]
  })
  selectedMorgan.token('url-query', (req, res) => escapeSpecialChars(JSON.stringify(req.query)))

  selectedMorgan.token('request-id', (req, res) => req.requestID)
}

exports.winstonLog = function (stream) {
  addCustomToken(morgan)
  return morgan(JSON.stringify(customFormat), stream)
}

exports.consoleLog = function () {
  return morgan(JSON.stringify(simpleFormat))
}