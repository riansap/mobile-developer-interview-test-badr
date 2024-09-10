import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import i18n from 'i18n'
import cors from 'cors'
import indexRouter from './routes/index'
import expressSwaggerModule from 'express-swagger-generator'
import configSwagger from '../config/swagger.js'
import responseTime from 'response-time'
import logger from './helpers/logger.js'

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

i18n.configure({
  defaultLocale: 'en',
  locales: ['en', 'id'],
  directory: path.join(__dirname, '../lang'),
  autoReload: true,
  updateFiles: false,
  objectNotation: true
})

const app = express()
app.get('/readyz', (req, res) => res.status(200).json({ status: 'ok' }))
app.get('/livez', (req, res) => res.status(200).json({ status: 'ok' }))

app.disable('x-powered-by')

const originalSend = app.response.send
app.response.send = function sendOverWrite(body) {
  originalSend.call(this, body)
  this.resBody = body
}

const expressSwagger = expressSwaggerModule(app)

app.set('views', path.join(`${__dirname}/../`, 'views'))
app.set('view engine', 'ejs')

let debugLogger = process.env.DEBUG_LOGGER ?? true
if (debugLogger === true) {
  app.use(logger)
}

app.use(i18n.init)
app.use(responseTime())
app.use(cors(corsOptions))
app.use((req, res, next) => {
  req.requestID = new Date().getTime() + Math.random().toString(36)
  next()
})

app.use(express.json({limit : '5mb'}))
app.use(express.urlencoded({extended: false, parameterLimit : 50000 }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '../public')))

expressSwagger(configSwagger)

// Setup maintenance on specific APIs
// app.all('/v2/order', maintenance)

app.use('/', indexRouter)

app.use(function (req, res, next) {
  res.status(404).json({ message: 'Not found' })
  // next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  const isDev = req.app.get('env') === 'development'
  res.locals.error = err
  const message = isDev ? (err.stack || err.message ) : (err.message || 'Internal server error')
  return res.status(err.status || 500).json({ message })
})

export default app
