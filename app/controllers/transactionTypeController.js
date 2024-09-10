import models from '../models'
import errorResponse from '../helpers/errorResponse'

const { TransactionType } = models

export async function listReason(req, res, next) {
  try {
    const { id } = req.params
    var data = null
    data = await TransactionType.findByPk(id, {
      include: {
        association: 'transaction_reasons',
        attributes: ['id', 'title']
      }
    })
    if (!data) return res.status(400).json(errorResponse('Data tidak ditemukan'))
    return res.status(200).json(data.transaction_reasons)
  } catch (err) {
    return next(err)
  }
}

