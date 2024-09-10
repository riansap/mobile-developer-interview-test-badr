import { Op } from 'sequelize'
import { parsingArrIds } from '../helpers/common'

export async function list(req, res, next) {
  try {
    const condition = []

    const { province_id, regency_id, keyword } = req.query

    if (province_id) condition.push({ province_id: parsingArrIds(province_id) })

    if (regency_id) condition.push({ regency_id: parsingArrIds(regency_id) })

    if (keyword) condition.push({ name: { [Op.like]: `%${keyword}%` } })

    if (condition.length > 0) req.condition = condition

    return next()
  } catch (error) {
    return next(error)
  }
}
