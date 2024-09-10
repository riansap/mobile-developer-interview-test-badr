import { Op } from 'sequelize'
import models from '../models'

export async function list(req, res, next) {
  try {
    let condition = {}
    const { keyword, entity_id } = req.query

    req.include = [
      {
        model: models.Entity,
        as: 'entity',
        attributes: ['id', 'name', 'address']
      },
      {
        model: models.Material,
        as: 'material',
        attributes: models.Material.getBasicAttribute()
      }
    ]

    req.order = [[{model: models.Material, as: 'material'}, 'name', 'ASC']]

    if (keyword) {
      req.include[1].where = {
        name: {
          [Op.like]: `%${keyword}%`
        }
      }
    }
    if(entity_id) {
      req.condition = {
        entity_id: entity_id
      }
    }

    if (JSON.stringify(condition) !== '{}') req.condition = condition

    return next()
  } catch (err) {
    return next(err)
  }
}