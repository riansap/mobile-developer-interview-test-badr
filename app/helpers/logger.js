const pino = require('pino')
const pinoHttp = require('pino-http')

let sendLoki = process.env.LOKI_SEND ?? true
let pinoLokiTransport
if (sendLoki === true) {
  pinoLokiTransport = pino.transport({
    target: 'pino-loki',
    options: {
      host: process.env.LOKI_HOST ?? 'http://10.10.0.6:3100',
      batching: true, // Send in batch
      interval: process.env.LOKI_INTERVAL ?? 5, // default 5 seconds
      timeout: process.env.LOKI_TIMEOUT ?? 5e3, // default 3e4 / 30 seconds
      labels: {application: process.env.ELASTIC_APM_SERVICE_NAME ?? 'smile'}
    },
  })
}

const pinoOptions = {
  level: process.env.DEBUG ? 'info' : 'error'
}
let streams = [
  { stream: process.stdout },
]
if (sendLoki === true) {
  streams.push({ stream: pinoLokiTransport })
}

module.exports = pinoHttp(pinoOptions, pino.multistream(streams))