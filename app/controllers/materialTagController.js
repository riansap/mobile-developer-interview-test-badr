import { Op } from 'sequelize'

export function list(req, res, next) {
  const { keyword, is_ordered_purchase, is_ordered_sales } = req.query
  const condition = []
  if (keyword) condition.push({ title: {
    [Op.like]: `%${keyword}%`
  }})
  if(is_ordered_purchase) condition.push({is_ordered_purchase: is_ordered_purchase})
  if(is_ordered_sales) condition.push({is_ordered_sales: is_ordered_sales})

  req.condition = condition

  next()
}
