import models from '../models'
import { getLastPosition, getLastPositionEasyGo } from '../helpers/integrations/easyGoHelper'

export async function list(req, res, next) {
  try {
    const { province_id, regency_id } = req.query
    req.include = [{
      association: 'entity',
      attribute: models.Entity.getBasicAttribute()
    }]
    if(province_id) {
      req.include[0].where = {
        province_id: province_id
      }
    }
    if(regency_id) {
      req.include[0].where = {
        regency_id: regency_id
      }
    }

    req.mappingDocs = async ({ docs }) => {
      let listNopol = docs.map((el) => { return el.nopol })
      
      let lastPositionArray = []
      if(listNopol.length > 0) {
        lastPositionArray = await getLastPosition(listNopol).then((result) => {return result})
      }

      let mappingDevice = await docs.map(trackDevice => {
        // find lastPosition by nopol
        let find = lastPositionArray.find(obj => obj.nopol === trackDevice.nopol)
        if(!find) find = { 
          status: '',
          temperature: 0,
          timestamp: '',
          lon: null,
          lat: null
        }
        return {
          ...trackDevice.dataValues,
          ...find,
        }
      })
      return mappingDevice
    }
    return next()
  } catch (err) {
    return next(err)
  }
}


export async function lastPositionEasyGo(req, res, next) {
  try {
    const trackDevices = await models.TrackDevice.findAll()
    let listNopol = trackDevices.map((el) => { return el.nopol })
    if(listNopol.length > 0) {
      const result = await getLastPositionEasyGo(listNopol)
      return res.status(200).json({ message: result })
    }
  } catch (err) {
    return next(err)
  }
}
