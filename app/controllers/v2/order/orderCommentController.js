import models from '../../../models'

export async function createComment(body, t) {
  try {
    return await models.OrderComment.create({
      ...body
    }, { transaction: t })
  } catch (err) {
    throw Error(err)
  }
}