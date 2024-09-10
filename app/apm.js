import { config } from 'dotenv'
config()

let sendApm = process.env.ELASTIC_APM_DISABLE_SEND || false
if (sendApm) {
  // Add this to the VERY top of the first file loaded in your app
  require('elastic-apm-node').start()
}