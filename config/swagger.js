'use strict'

// const { VERSION_MOBILE } = require('../app/helpers/constants')
// import { VERSION_MOBILE } from '../app/helpers/constants'

require('dotenv').config()

const port = process.env.PORT || '8080'
const baseUrl = process.env.APP_URL || 'localhost'
const url = process.env.NODE_ENV === 'production' ? baseUrl : baseUrl + ':' + port
const path = process.env.NODE_ENV === 'production' ? ['../docs/api/*.js', '../docs/api/**/*.js'] : ['../app/routes/*.js', '../app/routes/**/*.js']

module.exports = {
  swaggerDefinition: {
    info: {
      title: 'SMILE Main API Documentation',
      description: 'This is swagger generated api documentation for SMILE Main API',
      // version: VERSION_MOBILE.version_name,
    },
    host: url,
    basePath: '/',
    produces: [
      'application/json',
      'application/xml'
    ],
    schemes: ['http', 'https'],
    securityDefinitions: {
      JWT: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Bearer Token',
      },
      acceptLanguange: {
        type: 'apiKey',
        in: 'header',
        name: 'accept-language',
        description: 'Accept Language: id, en',
      },
      deviceType: {
        type: 'apiKey',
        in: 'header',
        name: 'device-type',
        description: 'Device Type: mobile, web, elearning, monitor',
      },
      timezone: {
        type: 'apiKey',
        in: 'header',
        name: 'timezone',
        description: 'timezone: Asia/Jakarta',
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: path //Path to the API handle folder
}