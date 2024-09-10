import redisStore from 'rate-limit-redis'
const redis = require('redis')
import config from '../../../config/redis'

const LIMITTER_OPTIONS = {
  windowMs: 15 * 1000, // 15 seconds
  max: 1,
  keyGenerator: function(req, res) {
    return req.originalUrl
  }
}

const redisOptions = process.env.REDIS_HOST ? {
  expiry: 10,
  client: redis.createClient(config),
  passIfNotConnected: true,
} : {}

if(process.env.REDIS_HOST) {
  // LIMITTER_OPTIONS.store = new redisStore(redisOptions)
}
export const limitterOptions = LIMITTER_OPTIONS