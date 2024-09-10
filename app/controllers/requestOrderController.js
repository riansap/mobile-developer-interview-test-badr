import models from '../models'

export async function create(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    if (req.user) {
      const { id } = req.user
      req.body = {
        ...req.body,
        created_by: id,
        updated_by: id
      }
    }
    let customer = await models.Entity.findOne({
      where: { code: req.body.customer_code }
    })
    let vendor = req.entityID
    req.body = {
      ...req.body,
      customer_id: customer.id,
      vendor_id: vendor
    }
    const { order_items: orderItems } = req.body

    let requestOrder = await models.RequestOrder.create(req.body, { transaction: t })
    
    for(let j = 0; j < orderItems.length; j++) {
      const { material_code = null, qty = 0 } = orderItems[j]
      const material = await models.Material.findOne({
        where: { code: material_code }
      })
      await models.RequestOrderItem.create({
        material_id: material.id,
        qty: qty,
        request_order_id: requestOrder.id,
      }, { transaction: t })
    }

    await t.commit()

    requestOrder = await models.RequestOrder.findByPk(requestOrder.id)

    return res.status(201).json(requestOrder)
  } catch (err) {
    await t.rollback()
    console.error(err)
    return next(err)
  }
}
