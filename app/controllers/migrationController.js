import models from '../models'


export async function user (req, res, next) {
  try {
    const users = await models.User.findAll({
      include: [
        {
          association: 'entity',
          include: { association: 'province' }
        },
        { association: 'createdby' },
        { association: 'updatedby' },
      ]
    })
    return res.render('pages/user', {
      data: users,
      title: 'User Migration',
      moment: require('moment')
    })
  } catch (err) {
    next(err)
  }
}

export async function entity(req, res, next) {
  try {
    const entities = await models.Entity.findAll({
      include: [
        { association: 'province' }
      ]
    })
    return res.render('pages/entity', {
      data: entities,
      title: 'Entity Migration',
      moment: require('moment')
    })
  } catch (err) {
    next(err)
  }
}

export async function inventory(req, res, next) {
  try {
    const inventories = await models.MaterialEntity.findAll({
      include: [
        { association: 'material' },
        { association: 'entity' },
        { association: 'stocks', include: { association: 'batch' } },
      ]
    })
    return res.render('pages/inventory', {
      data: inventories,
      title: 'Inventory Migration Stock view',
      moment: require('moment')
    })
  } catch (err) {
    next(err)
  }
}

export async function transaction(req, res, next) {
  try {
    const transactions = await models.Transaction.findAll({
      include: [
        { association: 'material' },
        { association: 'entity' },
        { association: 'customer' },
        { association: 'stock', include: { association: 'batch' } },
      ]
    })
    return res.render('pages/transaction', {
      data: transactions,
      title: 'Transaction Migration Stock view',
      moment: require('moment')
    })
  } catch (err) {
    next(err)
  }
}