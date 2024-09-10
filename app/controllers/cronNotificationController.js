import models from '../models'
import { sendMultiNotif } from '../helpers/notifications/notificationService'
import { Op, Sequelize } from 'sequelize'
import moment from 'moment'
import { MATERIAL_TAG, NOTIFICATION_TYPE, ORDER_STATUS } from '../helpers/constants'
import { batchNotification } from '../helpers/notifications/batchNotificationService'
import { generateOrderNotification } from '../helpers/notifications/orderNotification'
import { generateVaccineNotification } from '../helpers/notifications/vaccineNotification'

export async function createGreatLessStockNotif(entityID) {
  try {
    const currentDate = moment().tz('Asia/Jakarta').format('ddd, DD MM YYYY, HH:mm:ss zz')

    let entityOptions = {}
    if (entityID)
      entityOptions = { where: { entity_id: entityID } }

    const materialEntityActivities = await models.EntityMasterMaterialActivities.findAll({
      where: [
        { min: { [Op.gt]: 0 } },
        { [Op.or]: [{ min: { [Op.gt]: Sequelize.col('stock_on_hand') } }, { max: { [Op.lt]: Sequelize.col('stock_on_hand') } }] },
        { activity_id: { [Op.not]: MATERIAL_TAG.COVID } }
      ],
      include: [
        {
          association: 'activity',
          attributes: ['id', 'name'],
          required: true
        },
        {
          association: 'entity_master_material',
          required: true,
          ...entityOptions,
          include: [
            {
              association: 'entity',
              attributes: ['id', 'name', 'province_id', 'regency_id'],
              required: true,
              include: [
                {
                  association: 'vendors',
                  attributes: ['id', 'name'],
                  include: {
                    association: 'users',
                    attributes: ['id', 'fcm_token', 'entity_id'],
                    where: {
                      [Op.and]: [
                        { fcm_token: { [Op.not]: null } }, { fcm_token: { [Op.not]: '' } }
                      ]
                    }
                  }
                },
                {
                  association: 'users',
                  attributes: ['id', 'fcm_token', 'entity_id'],
                  where: {
                    [Op.and]: [
                      { fcm_token: { [Op.not]: null } }, { fcm_token: { [Op.not]: '' } }
                    ]
                  }
                }
              ]
            },
            {
              association: 'material',
              attributes: ['id', 'name'],
              required: true
            }
          ]
        }
      ]
    })

    let data = []

    for (let materialEntityActivity of materialEntityActivities) {
      const { activity, entity_master_material, stock_on_hand, min, max } = materialEntityActivity
      const { entity, material } = entity_master_material
      const { users, vendors } = entity

      let title = ''
      let message = ''
      let type = ''
      if (stock_on_hand == 0) {
        title = 'Material out of stock'
        message = `SMILE-ID ${material.name} ${activity?.name} stok telah habis di fasilitas ${entity.name}`
        type = NOTIFICATION_TYPE.ZERO_STOCK
      } else if (stock_on_hand > max) {
        title = 'Stock > Max'
        message = `SMILE-ID ${material.name} ${activity?.name} sejumlah ${stock_on_hand} telah melebihi batas maksimum ${max} di fasilitas ${entity.name} pada ${currentDate}`
        type = NOTIFICATION_TYPE.OVER_STOCK
      } else if (stock_on_hand < min) {
        title = 'Stock < Min'
        message = `SMILE-ID ${material.name} ${activity?.name} sejumlah ${stock_on_hand} telah kurang dari batas minimum ${min} di fasilitas ${entity.name} pada ${currentDate}`
        type = NOTIFICATION_TYPE.LESS_STOCK
      }

      const payload = {
        message,
        title,
        type,
        action_url: null,
        media: ['fcm'],
        province_id: entity.province_id,
        regency_id: entity.regency_id
      }

      //send Notif to entity it self
      for (let user of users) {
        const notifPayload = {
          ...payload,
          user: user
        }

        data.push(notifPayload)
        await sendMultiNotif(notifPayload)
      }

      //send Notif to vendors
      for (let vendor of vendors) {
        for (let user of vendor.users) {
          const notifPayload = {
            ...payload,
            user: user
          }
          data.push(notifPayload)
          await sendMultiNotif(notifPayload)
        }
      }
    }

    return data
  } catch (err) {
    console.error(err)
    return err
  }
}


export async function createEdStockNotif(entityID) {
  try {
    let optionEntity = {}
    if (entityID) {
      optionEntity = { where: { entity_id: entityID } }
    }

    const start1D = moment().add(1, 'days').format('YYYY-MM-DD') + ' 00:00:00'
    const end1D = moment().add(1, 'days').format('YYYY-MM-DD') + ' 23:59:59'
    const start30 = moment().add(30, 'days').format('YYYY-MM-DD') + ' 00:00:00'
    const end30 = moment().add(30, 'days').format('YYYY-MM-DD') + ' 23:59:59'
    const start10D = moment().add(10, 'days').format('YYYY-MM-DD') + ' 00:00:00'
    const end10D = moment().add(10, 'days').format('YYYY-MM-DD') + ' 23:59:59'
    const edStocks = await models.Stock.findAll({
      attributes: models.Stock.getBasicAttributeV2(),
      include: [
        {
          association: 'batch',
          where: {
            [Op.or]: [
              { expired_date: { [Op.between]: [start1D, end1D] } },
              { expired_date: { [Op.between]: [start30, end30] } },
              { expired_date: { [Op.between]: [start10D, end10D] } },
            ]
          },
          required: true
        },
        {
          association: 'activity',
          attributes: ['id', 'name'],
          required: true
        },
        {
          association: 'entity_master_material',
          include: [{
            association: 'material',
            attributes: ['id', 'name'],
            required: true
          }, {
            association: 'entity',
            attributes: ['id', 'name', 'province_id', 'regency_id'],
            required: true
          }],
          ...optionEntity,
          required: true
        }
      ],
      where: { qty: { [Op.gt]: 0 } }
    })

    let data = []
    for (let item of edStocks) {
      const result = await batchNotification(item)

      data = [...data, ...result]
    }

    return data
  } catch (err) {
    console.err(err)
    return err
  }

}

export async function createOrderNotifNotReceive(entityID) {
  const condition = [{ status: ORDER_STATUS.SHIPPED }]

  if (entityID)
    condition.push({
      [Op.or]: [{ customer_id: entityID }, { vendor_id: entityID }]
    })
  const orders = await models.Order.findAll({
    where: condition,
    include: [
      {
        association: 'activity',
        attributes: ['id', 'name'],
        required: true
      }
    ]
  })

  let data = []

  for (let order of orders) {
    const result = await generateOrderNotification(order)
    data = [...data, ...result]
  }

  return data
}


export async function createNotifRabiesVaccine(entityID) {
  let now = moment().format('YYYY-MM-DD')
  let conditions = [{stop_notification: {[Op.ne]: 1}}]
  if (entityID) conditions.push({ entity_id: entityID })

  let conditions2 = []
  let ruleExp = {}

  let rules = await models.RabiesVaccineRule.findAll({
    where: { sequence: [1, 2, 4, 6] }
  })

  for (let rule of rules) {
    const { sequence, start_notification, end_notification } = rule
    if (sequence < 6)
      conditions2.push({ days: { [Op.between]: [start_notification, end_notification] }, vaccine_sequence: sequence })
    else{
      conditions2.push({ days2: { [Op.between]: [start_notification, end_notification] }, preexposure_sequence: sequence, vaccine_sequence: {[Op.is]: null} })
      ruleExp = rule
    }
  }

  const Patients = await models.Patient.findAll({
    attributes: [...models.Patient.getBasicAttribute(), [Sequelize.fn('datediff', now, Sequelize.col('last_vaccine_at')), 'days'], [Sequelize.fn('datediff', now, Sequelize.col('last_preexposure_at')), 'days2']],
    include: {
      association: 'entity',
      attributes: ['id', 'name', 'province_id', 'regency_id'],
      include: { association: 'users' }
    },
    having: {
      [Op.or]: conditions2
    },
    where: conditions
  })

  let data = []

  for (let patient of Patients) {
    const {days2} = patient.dataValues
    let is_preexposure = (days2 >= ruleExp.start_notification && days2 <= ruleExp.end_notification) && patient?.preexposure_sequence == 6 && !patient?.vaccine_sequence
    const result = await generateVaccineNotification(patient, is_preexposure)
    data = [...data, ...result]
  }

  return data
}

export async function createNotifBatchPerEntity() {
  try {
    console.log('=== Start Process Batch Notif per Entity ===')
    console.log('Start Process', moment().format('YYYY-MM-DD HH:mm:ss'))
    const dataEntities = await models.Entity.findAll({
      is_notif: true,
      attributes: ['id', 'name'],
      where: { is_vendor: 1, status: 1 },
    })

    // calc page data entites if per page 1000
    console.log(`Total Entity: ${dataEntities.length}`)
    const pages = Math.ceil(dataEntities.length / 1000) * 4 // dikali empat karena ada 4 process sekaligus 
    let page = 0

    let processNotifBatch = []
    for (let i = 0; i < dataEntities.length; i++) {
      const entity = dataEntities[i]
      processNotifBatch.push(createGreatLessStockNotif(entity.id))
      processNotifBatch.push(createEdStockNotif(entity.id))
      processNotifBatch.push(createOrderNotifNotReceive(entity.id))
      processNotifBatch.push(createNotifRabiesVaccine(entity.id))
      if (processNotifBatch.length === 1000) {
        page += 1
        console.log(`Total Page: ${pages}, Process Page: ${page}`)
        await Promise.all(processNotifBatch)
        processNotifBatch = []
      }
    }

    if (processNotifBatch.length > 0) {
      page += 1
      console.log(`Total Page: ${pages}, Process Page: ${page}`)
      await Promise.all(processNotifBatch)
      processNotifBatch = []
    }

    console.log('End Process', moment().format('YYYY-MM-DD HH:mm:ss'))
    console.log('=== End Process Batch Notif per Entity ===')
    return 'dataEntities'
  } catch (error) {
    return new Error(error)
  }
}