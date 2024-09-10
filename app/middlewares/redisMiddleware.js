const redis = require('redis')
import config from '../../config/redis'

export async function cacheUrl(req, res, next) {
  try {
    const { cacheKey } = req
    let key = (process.env.APP_URL || 'localhost') + '__expIress__'
    if (cacheKey) {
      key = cacheKey
    } else {
      if (req.redisKey) {
        key = req.redisKey
      }
      if (req.withUser) {
        key += `user_${req.user.id}`
      }
      key += decodeURIComponent(req.originalUrl) || decodeURIComponent(req.url)
    }
    const client = redis.createClient({
      url: 'redis://' + config.host + ':' + config.port,
    })
    client.on('error', (err) => {
      console.log('connect error', err)
    })
    let refreshCache = false
    if (req.refreshCache) {
      refreshCache = req.refreshCache
    }
    await client.connect()
    const value = await client.get(key)
    if (!refreshCache && await client.exists(key) && value) {
      res.set('Content-type', 'application/json').send(JSON.parse(value))
      console.log('Cache', key)
      await client.quit()
      return
    } else {
      await client.quit()
      res.sendResponse = res.send
      res.send = async (body) => {
        try {
          await client.connect()

          res.sendResponse(body)
          if (res.statusCode === 204) {
            await client.quit()
            return
          }
          await client.set(key, JSON.stringify(body))
          await client.expire(key, req.expire > 0 ? req.expire : config.expire)

          await client.quit()
        } catch (error) {
          console.log('response error', error)
        }
      }
      next()
    }
  } catch (error) {
    console.log('redis error', error)
  }
}
