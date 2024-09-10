import jwt from 'jsonwebtoken'
import errorResponse from '../helpers/errorResponse'
import models from '../models'
import { USER_ROLE, ENTITY_TYPE } from '../helpers/constants'
import { setKey, getKey, delKey } from '../helpers/services/redisHelper'

const { User } = models

export function isAuthenticate(req, res, next) {
  if (!req.headers.authorization) {
    res.status(401).json(errorResponse('Unauthorized'))
    return
  }

  const splitToken = req.headers.authorization.split(' ')
  if (splitToken.length !== 2 || splitToken[0] !== 'Bearer') {
    res.status(400).json(errorResponse('Wrong authorization format'))
    return
  }

  let secret = process.env.SECRET

  if (!splitToken[1]) {
    const { role } = jwt.decode(splitToken[1])
    if (role === USER_ROLE.SATUSEHAT) {
      secret = process.env.SECRET_SATUSEHAT
    }
  }
  
  jwt.verify(splitToken[1], secret, { algorithms: ['HS256'] }, async function (err, payload) {
    if (err && err.name === 'TokenExpiredError') {
      
      // if(await getKey(splitToken[1])) await delKey(splitToken[1])
      res.status(401).json(errorResponse('Expired Token'))
    } else if (err) {
      res.status(401).json(errorResponse('Invalid Token'))
    } else {
      try {
        const attribute = User.getBasicAttribute()
        // const cacheKey = 'auth_'+splitToken[1]
        // const loginCache = await getKey(cacheKey)
        let user = {}
        // console.log(loginCache)
        // if(loginCache) {
        //   user = JSON.parse(loginCache.toString())
        // } else {
        user = await User.findOne({
          where: {
            id: payload.id
          },
          include: { association: 'entity' },
          attributes: ['token_login', ...attribute]
        })
        // await setKey({
        //   key: cacheKey,
        //   ttl: 86400,
        //   body: user
        // })
        // }
        if (!user) {
          res.status(401).json(errorResponse('Invalid Token'))
          return
        }
        console.log(user.token_login === splitToken[1])
        if(user.role!= USER_ROLE.ASIK && user.role!= USER_ROLE.SATUSEHAT){
          if(user.token_login != splitToken[1]) {
            res.status(401).json(errorResponse('Token expired'))
            return
          }
        }
        
        if(user.change_password) {
          res.status(403).json(errorResponse(req.__('custom.change_password')))
          return
        }

        req.user = user
        req.entityID = user.entity_id
        req.timezone = req.headers.timezone
        next()
      } catch (err) {
        console.log(err)
        return next(err)
      }
    }
  })
}

export function hasRole(roles = []) {
  return async (req, res, next) => {
    try {
      for(let i = 0; i <= roles.length; i++) {
        if(USER_ROLE[roles[i]] === req.user.role){
          return next()
        }
      }
      res.status(403).json(errorResponse('Forbidden Access'))
      return 
    } catch(err) {
      res.status(500).json(errorResponse('Internal server error'))
      return
    }
  }
}

export function hasEntityType(entityTypes = []) {
  return async (req, res, next) => {
    try {
      for(let i = 0; i <= entityTypes.length; i++) {
        if(ENTITY_TYPE[entityTypes[i]] === req.user.entity.type){
          return next()
        }
      }
      res.status(403).json(errorResponse('Tidak dapat melaporkan kejadian'))
      return 
    } catch(err) {
      // console.log(err)
      res.status(500).json(errorResponse('Internal server error'))
      return
    }
  }
}

export function notHasRole(roles = []) {
  return async (req, res, next) => {
    try {
      for(let i = 0; i <= roles.length; i++) {
        if(USER_ROLE[roles[i]] === req.user.role){
          return res.status(403).json(errorResponse('Forbidden Access'))
        }
      }
      return next()
    } catch(err) {
      res.status(500).json(errorResponse('Internal server error'))
      return
    }
  }
}

// post put
export function forbiddenViewOnly() {
  return async (req, res, next) => {
    try {
      if(req.user.view_only){
        return res.status(403).json(errorResponse('Forbidden Access, This user can access view only'))
      }
      return next()
    } catch(err) {
      res.status(500).json(errorResponse('Internal server error'))
      return
    }
  }
}
