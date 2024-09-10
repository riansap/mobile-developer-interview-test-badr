import { Op } from 'sequelize'

export function list(req, res, next) {
  const { keyword, entity_id } = req.query
  const condition = []
  if (keyword) condition.push({ serial_number: {
    [Op.like]: `%${keyword}%`
  }})
  if (entity_id) condition.push({ entity_id: entity_id})

  if (JSON.stringify(condition) !== '[]') req.condition = condition

  next()
}
