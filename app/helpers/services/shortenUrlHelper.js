import axios from 'axios'

import { setKey, getKey } from './redisHelper'

export async function generateUrl(fullURL) {
  // check in redis
  let cachedUrl = await getKey(fullURL) || null
  if(cachedUrl) return JSON.parse(cachedUrl)
    
  const REBRANDLY_API = process.env.REBRANDLY_API
  const REBRANDLY_KEY = process.env.REBRANDLY_KEY
  const REBRANDLY_WORKSPACE = process.env.REBRANDLY_WORKSPACE
  
  let requestHeaders = {
    'Content-Type': 'application/json',
    'apikey': REBRANDLY_KEY,
    'workspace': REBRANDLY_WORKSPACE
  }
  let linkRequest = {
    destination: fullURL,
    domain: { fullName: 'rebrand.ly' }
  }
  const { data } = await axios({
    method: 'POST',
    url: `${REBRANDLY_API}/v1/links`,
    headers: requestHeaders,
    data: linkRequest
  })
  
  await setKey({
    key: fullURL,
    body: data.shortUrl
  })
  
  return data.shortUrl
}