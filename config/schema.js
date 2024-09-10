require('dotenv').config()

const env = String(process.env.NODE_ENV).replace(/\s/g, '') || 'development'
const dbConfig = require('./database')
let mainSchema = ''
if(dbConfig[env]) {
  if(dbConfig[env].database) mainSchema = dbConfig[env].database
}
console.log(`ENV===== ${env} ${'test'}`, env === 'test')
if (env !== 'production') {
  console.log('DB CONFIG=====', dbConfig[env])
}

module.exports = {
  mainSchema
}