const redis = require('redis')
import { promisify } from 'util'
import config from '../../../config/redis'

export async function getKey(key) {
  try {
    const client = redis.createClient(config)

    await client.connect()
  
    const cacheValue = await client.get(key)

    await client.quit()

    return cacheValue
  } catch (error) {
    console.error(error)
    // throw Error(error)
  }
}

export async function setKey({ key, ttl = 600, body }) {
  try {
    // const client = Promise.all(createClient)
    const client = redis.createClient(config)
    await client.connect()
    await client.set(key, JSON.stringify(body), redis.print)
    await client.expire(key, ttl > 0 ? ttl : config.expire)
    await client.quit()
  } catch (error) {
    console.error(error)
  }
}

export async function delKey(key) {
  try {
    const client = redis.createClient(config)
    await client.del(key)
    await client.quit()
  } catch (error) {
    console.error(error)
  }
}

