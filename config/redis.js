require('dotenv').config()

module.exports = {
  port: process.env.REDIS_PORT || '6379',
  host: process.env.REDIS_HOST ||'127.0.0.1',
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || undefined,
  expire: process.env.REDIS_EXPIRE || 600,
  url: 'redis://'+process.env.REDIS_HOST || '127.0.0.1'+':'+process.env.REDIS_PORT || 6379
}