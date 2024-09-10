import { Op } from 'sequelize'
import models from '../models'
import { batchNotification, batchManagerNotification } from '../helpers/notifications/batchNotificationService'
import moment from 'moment-timezone'
import { ENTITY_TYPE, KFA_LEVEL_ID } from '../helpers/constants'

export function list(req, res, next) {
  const { keyword, material_id, kfa } = req.query
  const condition = {}
  if (keyword) condition.code = {
    [Op.like]: `%${keyword}%`
  }

  // batch -> stock -> material_entity -> material
  if(material_id && !kfa) {
    // kfa=false means that the material_id is from imunization (equivalent of type 93 logistic)
    req.include = {
      association: 'stocks',
      attributes: ['id', 'batch_id', 'entity_has_material_id'],
      include: {
        association: 'entity_master_material',
        attributes: ['id', 'master_material_id'],
        where: {
          material_id: material_id
        }
      }
    }
  } else if (material_id && kfa) {
    // kfa=true means that the material_id is from logistic of type 92
    req.include = {
      association: 'stocks',
      attributes: ['id', 'batch_id', 'entity_has_material_id'],
      include: {
        association: 'entity_master_material',
        attributes: ['id', 'master_material_id'],
        include: {
          association: 'material',
          attributes: ['id', 'name', 'parent_id', 'kfa_level_id'],
          where: {
            parent_id: material_id,
            kfa_level_id: KFA_LEVEL_ID.VARIANT
          }   
        }
      }
    }
  }

  if (JSON.stringify(condition) !== '{}') req.condition = condition

  next()
}

function formatDateToString(date, format = 'YYYY-MM-DD') {
  return moment(date).format(format)
}

export async function expiredNotification() {
  const thirtyDays = moment().add(30, 'days').format('YYYY-MM-DD')

  const expiredDateConditions = [
    {
      expired_date: { [Op.between]: [
        `${thirtyDays} 00:00:00`,
        `${thirtyDays} 23:59:59`,
      ]}
    }
  ]

  const notifyManagerInDays = [
    14, 10, 3, 1, 0
  ]
  const formatManagerDate = []
  notifyManagerInDays.forEach(el => {
    const formatExpiredDate = moment().add(el, 'days').format('YYYY-MM-DD')
    formatManagerDate.push(formatDateToString(formatExpiredDate))
    expiredDateConditions.push({
      expired_date: { [Op.between]: [
        `${formatExpiredDate} 00:00:00`,
        `${formatExpiredDate} 23:59:59`
      ]}
    })
  })

  const stocks = await models.Stock.findAll({
    where: {
      qty: {[Op.not]: 0}
    },
    include: [{
      association: 'batch',
      where: {
        [Op.or]: expiredDateConditions
      },
      attributes: models.Batch.getBasicAttribute(),
      required: true,
    }, {
      association: 'entity_master_material',
      attributes: models.EntityMasterMaterial.getBasicAttribute(),
      required: true,
      include: [
        {
          association: 'material',
          attributes: models.MasterMaterial.getBasicAttribute(),
          required: true,
        },
        {
          association: 'entity',
          attributes: models.Entity.getBasicAttribute(),
          required: true,
        },
      ]
    },
    {
      association: 'activity',
      attributes: ['id', 'name'],
    }],
    order: [['batch_id', 'ASC']],
  })

  // for common notif to each entities
  for (let stock of stocks) {
    if(formatManagerDate.includes(formatDateToString(stock.batch.expired_date))) {
      // notifyBatch
    } else {
      console.info('-----NOTIFY BATCH EXPIRED---------', thirtyDays, stock.batch.code, stock.batch.expired_date)
      await batchNotification(stock)
    }
  }

  // for manager notifications
  var stocksForManager = stocks.filter(el => {
    const isInclude = formatManagerDate.includes(formatDateToString(el.batch.expired_date))
    return isInclude
  }).filter(el => {
    return el.entity_master_material.material.is_vaccine === 1
  })
  stocksForManager = uniqueBy(stocksForManager, 'batch_id')

  await generateNotifManager({managerStocks: stocksForManager, allStocks: stocks})

  return 'expired_notif_finished'
}

function uniqueBy(array, prop) {
  const uniqueArray = []
  for(let el of array) {
    const isExist = uniqueArray.findIndex(unique => unique[prop] === el[prop])
    if(isExist < 0) uniqueArray.push(el)
  }
  return uniqueArray
}

function groupStockByRegency(arrayOfEntity) {
  const entityRegencies = []
  arrayOfEntity.forEach(entity => {
    const newRegency = {
      regencyId: entity.regency_id,
      regency: entity.regency,
      provinceId: entity.province_id,
      province: entity.province,
      stocks: [
        entity
      ]
    }
    const existKey = entityRegencies.findIndex(el => el.regencyId === entity.regency_id)
    if(existKey >= 0) entityRegencies[existKey]['stocks'].push(entity)
    else entityRegencies.push(newRegency)
  })
  return entityRegencies
}

async function generateNotifManager({managerStocks, allStocks = []}) {
  for(let managerStock of managerStocks) {
    const { batch, entity_master_material, activity } = managerStock

    const stocks = allStocks.filter(el => el.batch_id === batch.id )
    const entityIds = stocks.map(el => {
      return el.entity_master_material.entity_id
    })

    const material = entity_master_material.material
    let entities = await models.Entity.findAll({
      where: {
        id: { [Op.in]: entityIds },
        type: { [Op.not]: ENTITY_TYPE.BIOFARMA}
      },
      include: [{
        association: 'regency',
        attributes: ['id', 'name']
      }, {
        association: 'province',
        attributes: ['id', 'name']
      }]
    })
    entities.forEach((entity, index) => {
      const stockEntity = stocks.find(st => st.entity_master_material.entity_id === entity.id)
      entities[index] = {
        ...entity.dataValues,
        stock: stockEntity
      }
    })

    const entityProvince = entities.filter(en => en.type === ENTITY_TYPE.PROVINSI)
    const otherEntitTypes = [
      ENTITY_TYPE.KOTA,
      ENTITY_TYPE.FASKES
    ]
    entities = entities.filter(en => otherEntitTypes.includes(en.type))
    entities = groupStockByRegency(entities)

    const notificationData = {
      material,
      batch,
      provEntities: entityProvince,
      otherEntities: entities,
      activity
    }
    console.info('-----NOTIFY MANAGER: BATCH EXPIRED---------', batch.expired_date, batch.code)
    await batchManagerNotification(notificationData)
  }
}
