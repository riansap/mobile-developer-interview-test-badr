import config from '../../config/redis'
import { CONFIGURATIONS, parseConfigValue } from '../helpers/config'
import { USER_ROLE } from '../helpers/constants'
import models from '../models'

const { Configuration } = models

export function maintenance(req, res, next) {
  if (req.method !== 'GET') {
    return res.status(422).json({ message: process.env.MAINTENANCE_MESSAGE || req.__('maintenance') })
  }
  next()
}

export async function validateFreezeTransactions(req, res, next) {
  if (USER_ROLE['ADMIN_SO'] === req.user.role) {
    return next()
  }
  const redis = require('redis')
  const client = await redis.createClient({
    url: 'redis://' + config.host + ':' + config.port,
  })
  client.on('error', (err) => console.log('connect error', err))
  await client.connect()

  let value = await client.get(CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.cacheKey)

  if (value === null) {
    // if not exist in redis, get from database
    value = await (async () => {
      let configKey = CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.dbKey
      let config = await Configuration.findOne({
        where: {
          key: configKey,
        },
      })
      let configValue = config !== null ? config.value : false
      let newValue = {
        'freeze': parseConfigValue(configValue, CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.type),
        'message': 'OK',
      }
      if (config) {
        await client.set(configKey, `"${JSON.stringify(newValue).replace(/"/g, '\\"')}"`)
      }
      return newValue
    })()
  } else {
    value = JSON.parse(JSON.parse(value))
  }
  await client.quit()
  //value is boolean, validate whether value is true or false
  if (value.freeze === 'true' || value.freeze === true) {
    return res.status(403).json({ message: req.__('freeze_transaction') })
  }
  return next()
}
