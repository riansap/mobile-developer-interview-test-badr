const winston = require('winston')

require('dotenv').config()
require('winston-mongodb')

const options = {
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
}

if (process.env.LOG_MONGODB || process.env.NODE_ENV !== 'test') {
  options.mongo = {
    collection: process.env.LOG_COLLECTION,
    db: `mongodb://${process.env.LOG_USER}:${process.env.LOG_PASSWORD}@${process.env.LOG_MONGODB}?authSource=${process.env.LOG_AUTHSRC}`,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  }
}

const loggerOptions = {
  format: winston.format.combine(
    winston.format.json(),
    winston.format.metadata(),
  ),
  transports: [],
  exitOnError: false, // do not exit on handled exceptions
  metadata: true,
  levels: {
    error: 0,
    warn: 1,
    http: 2,
    info: 3,
    test: 4,
    debug: 5,
  },
}

if (process.env.LOG_MONGODB) {
  loggerOptions.transports.push(
    new winston.transports.MongoDB(options.mongo),
  )
} else {
  loggerOptions.transports.push(
    new winston.transports.Console(options.console),
  )
}

const logger = winston.createLogger(loggerOptions)

logger.stream = {
  write(message) {
    const log = JSON.parse(message)
    logger.log('http', message, log)
  },
}

exports.winstonLogger = logger

exports.cfgReqLog = {
  transports: [
    new winston.transports.Console(),
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
    winston.format.metadata(),
  ),
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  metadata: true,
}
