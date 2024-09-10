import models from '../models'
import errorResponse from '../helpers/errorResponse'

export const provinceRegencySubDistrictVillage = async (req, res, next) => {
  try {
    const { province_id, regency_id, sub_district_id, village_id } = req.body

    if (province_id === null && regency_id === null && sub_district_id === null && village_id === null) {
      return next()
    }

    let regency = null, sub_district = null, village = null
    if(regency_id && province_id) {
      regency = await models.Regency.findOne({
        where: {
          id: regency_id,
          province_id,
        }
      })
    }

    if(regency_id && sub_district_id) {
      sub_district = await models.SubDistrict.findOne({
        where: {
          id: sub_district_id,
          regency_id,
        }
      })
    }

    if(village_id && sub_district_id) {
      village = await models.Village.findOne({
        where: {
          id: village_id,
          sub_district_id
        }
      })
    }

    if (regency_id && !regency) {
      handleValidation('regency_id', res)
    }
    
    if (sub_district_id && !sub_district) {
      handleValidation('sub_district_id', res)
    }
    
    if (village_id && !village) {
      handleValidation('village_id', res)
    }

    next()
  } catch(err) {
    return next(err)
  }
}

function handleValidation(param, res) {
  const errors = [
    {
      msg: 'relation not found',
      param
    }
  ]

  const extractedErrors = {}
  errors.forEach(value => {
    if (!value.param) value.param = 'general'

    if (!extractedErrors[value.param]) extractedErrors[value.param] = [value.msg]
    else extractedErrors[value.param].push(value.msg)
  })


  return res.status(422).json(errorResponse(
    'Unprocessable Entity',
    extractedErrors
  ))
}