//import { Op } from 'sequelize'
import models from '../models'
import moment from 'moment'

const { sequelize } = models

export async function insertEntityActivities(req, res, next) {
  try {
    let {
      user
    } = req

    const {
      entity_id
    } = req.query

    console.time('[insertData]')

    let optionsEntityMaterial = {}
    let optionsEntityMaterialActivity = {paranoid: false}
    let optionsStock = {}
    if (entity_id) {
      optionsEntityMaterial = {
        where: { entity_id: entity_id }
      }

      optionsEntityMaterialActivity = {
        include: [
          {
            association: 'entity_master_material',
            where: { entity_id: entity_id },
            required: true
          }
        ],
        paranoid: false
      }

      optionsStock = {
        include: [
          {
            association: 'entity_master_material',
            where: { entity_id: entity_id },
            required: true
          }
        ]
      }
    }


    const entityMaterial = await models.EntityMasterMaterial.findAll({
      attributes: ['id', 'master_material_id'],
      ...optionsEntityMaterial
    })

    const entityMaterialActivities = await models.EntityMasterMaterialActivities.findAll(optionsEntityMaterialActivity)

    const stocks = await models.Stock.findAll(optionsStock)

    const materialActivities = await models.MasterMaterialActivities.findAll()

    let data = []
    let dataUpdate = []

    console.log(stocks.length)

    let createdAt = moment().toDate()

    for (let item of entityMaterial) {
      let activities = materialActivities.filter(it => it.master_material_id == item.master_material_id)

      for (let activity of activities) {
        let entitiesAct = entityMaterialActivities.filter(it => it.entity_master_material_id == item.id && it.activity_id == activity.activity_id)

        let stock = stocks.filter(it => it.entity_has_material_id == item.id && it.activity_id == activity.activity_id)

        let allocated = 0
        let stock_on_hand = 0
        for (let dt of stock) {
          allocated += dt.allocated
          stock_on_hand += dt.qty
        }

        if (entitiesAct.length <= 0) {
          data.push({
            entity_master_material_id: item.id,
            activity_id: activity.activity_id,
            allocated: allocated,
            stock_on_hand: stock_on_hand,
            created_by: user.id,
            created_at: createdAt,
            updated_at: createdAt
          })
        } else {
          let entityActivity = entitiesAct[0]
          if (!entityActivity.deleted_at) {
            const updt = await models.EntityMasterMaterialActivities.update({
              allocated: allocated,
              stock_on_hand: stock_on_hand,
              updated_by: user.id,
              updated_at: createdAt
            }, {
              where: { id: entityActivity.id }
            })

            dataUpdate.push(...entitiesAct)
          }
        }
      }
    }
    if (data.length > 0)
      await models.EntityMasterMaterialActivities.bulkCreate(data, {
        logging: false,
        ignoreDuplicates: true
      })

    console.timeEnd('[insertData]')

    return res.status(200).json({
      success: 'Ok',
      inserted: data.length + ' items',
      updated: dataUpdate.length + ' items'
    })

  } catch (error) {
    console.error(error)
    return next(error)
  }
}