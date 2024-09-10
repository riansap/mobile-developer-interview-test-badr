import { Op } from 'sequelize'
import moment from 'moment'

const updateData = '2021-05-24 17:00:00'

export async function list(req, res, next) {
  try {
    let { from_date, to_date } = req.query
    let condition = [
      { worker_name: {[Op.in]: ['order_bpom', 'trans_bpom']} },
      { res_status: {[Op.not]: '200'} },
      { created_at: {[Op.gte]: updateData} }
    ]
    if(from_date) from_date = moment(from_date).format('YYYY-MM-DD') + ' 00:00:00'
    if(to_date) to_date = moment(to_date).format('YYYY-MM-DD') + ' 23:59:59'
    if(condition.length) req.condition = condition

    req.order = [['id', 'desc']]
    req.customOptions = { subQuery: false }
    req.attributes = [
      'id', 
      'url', 
      'worker_name', 
      'res_status', 
      'retry_status', 
      'created_at', 
      'updated_at',
    ]

    return next()
  } catch (error) {
    return next(error)
  }
}
