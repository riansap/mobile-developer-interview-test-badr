import { Op } from 'sequelize'
import models from '../models'
import { materialStockNotification } from '../helpers/notifications/notificationService'
import { sendRecapListNotif } from '../helpers/notifications/recapNotification'

export async function recapEntityNotification() {
  try {
    await sendRecapListNotif()

    return 'recap_notif_finished'
  } catch (err) {
    console.log(err)
    // next(err)
  }
}

export async function checkStockMaterial(req, res, next) {
  try {
    const { material_entity_ids, target_user_ids } = req.body
    const { timezone } = req.headers

    let materialEntityIds = []
    let oldStocks = []
    let activityId = []

    material_entity_ids.map(el => {
      materialEntityIds.push(el.id)
      oldStocks.push(el.oldStock)
      activityId.push(el.activityId)
    })

    const materialEntities = await models.EntityMasterMaterial.findAll({
      where: {
        id: { [Op.in]: materialEntityIds },
        '$material.material_tags.title$': { [Op.not]: 'COVID-19' }
      },
      with_stocks: true,
      include: [
        {
          association: 'material',
          attributes: ['id', 'name'],
          include: {
            association: 'material_tags',
            attributes: ['id', 'title'],
            required: true
          }
        },
        {
          association: 'entityMasterMaterialActivities',
          attributes: ['activity_id', 'stock_on_hand', 'min', 'max']
        }
      ]
    })

    const users = await models.User.findAll({
      where: {
        id: { [Op.in]: target_user_ids }
      },
      attributes: ['id', 'firstname', 'lastname', 'fullname', 'email', 'entity_id', 'mobile_phone']
    })

    for (let i = 0; i < materialEntityIds.length; i++) {
      for (let j = 0; j < users.length; j++) {
        var id = materialEntityIds[i]
        var selected = materialEntities.filter(it => it.id == id)
        if (selected.length > 0) {
          const materialEntity = selected[0]
          await materialStockNotification({ timezone: timezone, materialEntity, user: users[j], oldStock: oldStocks[i], activityId: activityId[i] })
        }
      }
    }

    return res.status(200).json({ message: 'Sukses' })
  } catch (err) {
    next(err)
  }
}
