import { publishWorker } from '../services/rabbitmqHelper'
import models from '../../models'
import { USER_ROLE, STATUS } from '../constants'

import moment from 'moment-timezone'
import _ from 'lodash'

const SMILE_URL = process.env.SMILE_URL

export async function generateMaterialNotification(timezone, users = [], materialEntities = []) {
  try {
    const url = SMILE_URL+'/job/check-stock-material'
    const payload = {
      url: url,
      data: {
        material_entity_ids: materialEntities,
        target_user_ids: users
      },
      headers: {
        timezone: timezone || 'Asia/Jakarta'
      },
      method: 'POST'
    }
    // console.log('payload', JSON.stringify(payload), materialEntities)
    await publishWorker('http-worker', payload)
    // data
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function materialStockNotification({timezone = 'Asia/Jakarta', materialEntity, user, oldStock = 0, activityId}) {
  try {
    const currentDate = moment().tz(timezone).format('ddd, DD MM YYYY, HH:mm:ss zz')
    const material = await materialEntity.getMaterial()
    const entity = await materialEntity.getEntity()
    const vendorIds = await entity.getVendors()
    let entityMasterMaterialActivity = {}
    if (materialEntity.entityMasterMaterialActivities?.length > 1) {
      const entityMasterMaterialActivities = _.groupBy(materialEntity.entityMasterMaterialActivities, 'activity_id')
      entityMasterMaterialActivity = entityMasterMaterialActivities[activityId][0] || materialEntity.entityMasterMaterialActivities[0]
    } else {
      entityMasterMaterialActivity = materialEntity.entityMasterMaterialActivities[0]
    }

    const activity = activityId || entityMasterMaterialActivity.activity_id
    const activityDetail = await models.MasterActivity.findByPk(activity)

    const{
      stock_on_hand
    }  = entityMasterMaterialActivity

    const qty = stock_on_hand  //entityMasterMaterialActivity.dataValues.stock_on_hand //materialEntity.on_hand_stock
    let notifications = []
    let title = ''

    
    // Logic notification when out of stock
    if (qty === 0) {
      title = 'Material out of stock'
      const text = `SMILE-ID ${material.name} ${activityDetail?.name} stok telah habis di fasilitas ${entity.name}`
      notifications.push({title: title, text: text})
    } else if (qty >= entityMasterMaterialActivity.min && qty <= entityMasterMaterialActivity.max) {
      if((oldStock < entityMasterMaterialActivity.min && entityMasterMaterialActivity.min) || (oldStock > entityMasterMaterialActivity.max && entityMasterMaterialActivity.max)) {
        // Logic notification when Stock back to normal level
        let labelStatus = oldStock > entityMasterMaterialActivity.max ? `status > ${entityMasterMaterialActivity.max}` : `status < ${entityMasterMaterialActivity.min}`
        title = 'Stock back to normal'
        const text = `SMILE-ID ${material.name} ${activityDetail?.name} telah kembali ke batas normal dari ${labelStatus} di fasilitas ${entity.name} , dan stok sekarang adalah ${qty}.`
        notifications.push({title: title, text: text})
      }
    } else {
      if (entityMasterMaterialActivity.max > 0 && qty > entityMasterMaterialActivity.max && (oldStock <= entityMasterMaterialActivity.max || oldStock === 0)) {
        title = 'Stock > Max'
        const text = `SMILE-ID ${material.name} ${activityDetail?.name} sejumlah ${qty} telah melebihi batas maksimum ${entityMasterMaterialActivity.max} di fasilitas ${entity.name} pada ${currentDate}`
        notifications.push({title: title, text: text})
      }
  
      if (entityMasterMaterialActivity.min > 0 && qty < entityMasterMaterialActivity.min && (oldStock >= entityMasterMaterialActivity.min || oldStock === 0)) {
        title = 'Stock < Min'
        const text = `SMILE-ID ${material.name} ${activityDetail?.name} sejumlah ${qty} telah kurang dari batas minimum ${entityMasterMaterialActivity.min} di fasilitas ${entity.name} pada ${currentDate}`
        notifications.push({ title: title, text: text })
      }
    }

    
    for(let i = 0; i < notifications.length; i++) {
      let { title: notifTitle, text } = notifications[i]
      if(text) {
        await publishWorker('whatsapp', {
          mobile: user.mobile_phone,
          message: text
        })
        for(let j = 0; j < vendorIds.length; j++) {
          await recapNotification({
            entity_id: vendorIds[j].id,
            title: notifTitle,
            message: text
          })
        }
      }
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function entityNotification(entity) {
  try {
    const currentDate = new Date()

    const admins = await models.User.findAll({
      where: [{
        role: USER_ROLE.ADMIN
      }, {
        status: STATUS.ACTIVE
      }]
    })

    for (let index = 0; index < admins.length; index++) {
      const admin = admins[index]
      if(admin.mobile_phone) {
        const text = currentDate +
        `: Entitas Baru ${admin.firstname} telah dibuat untuk ${entity.name}`

        await publishWorker('whatsapp', {
          mobile: admin.mobile_phone,
          message: text
        })
      }
    }
  } catch (err) {
    console.log(err)
    throw err
  }
}

export async function recapNotification({entity_id, title, message}) {
  // let cacheKey = 'notification-'+entity_id
  // // let cachedMessage = recapCache.get(cacheKey) || '[]'
  // let cachedMessage = await getKey(cacheKey) || '[]'
  // cachedMessage = JSON.parse(cachedMessage.toString())
  // let idxTitle = cachedMessage.findIndex(el => el.title === title)

  // const timestamp = moment().format('DD/MM/YYYY HH:mm:ss')
  // message = `${timestamp} - ${message}`
  // if (idxTitle < 0) {
  //   cachedMessage.push({
  //     title: title,
  //     message: [message]
  //   })
  // } else {
  //   cachedMessage[idxTitle].message.push(message)
  // }
  // await setKey({
  //   key: cacheKey,
  //   ttl: 432000,
  //   body: cachedMessage
  // })
  // recapCache.set(cacheKey, JSON.stringify(cachedMessage), 432000)
  console.log('recap comment')
}

export async function sendRecapNotification(entity_id, users) {
  try {
    // const cacheKey = 'notification-'+entity_id
    // let recapNotif = await getKey(cacheKey)
    // // let recapNotif = recapCache.get(cacheKey)
    // if(recapNotif) {
    //   recapNotif = JSON.parse(recapNotif.toString())
    //   const subject = '[SMILE] Daily Notification Recap'
    //   const content = recapEmailTemplate(recapNotif)
      
    //   for(let i = 0; i < users.length; i++) {
    //     let { email } = users[i]
    //     if(email) {
    //       await publishWorker('email-notification', {
    //         mail: email,
    //         subject: subject,
    //         content: content
    //       })
    //     }
    //   }

    //   // delete after send
    //   await delKey(cacheKey)
    // }
    console.log('send recap comment')
  } catch (err) {
    console.log(err)
    throw  err
  }
}

export function recapEmailTemplate(notifications = []) {
  const date = moment().format('DD/MM/YY')
  let header = `<h1>Events On ${date}</h1>`

  let content = ''
  for(let i = 0; i < notifications.length; i++) {
    let { title, message } = notifications[i]
    content += `<h3>${title}</h3>`
    let rows = ''
    message.map(el => {
      rows += `<tr><td>${el}</td></tr>`
    })
    content += `<table>${rows}</table><br>`
  }
  return `${header}${content}`
}

export async function sendMultiNotif({ user, province_id, regency_id, message, title, type, media, action_url }) {
  const payload = {
    media,
    user: {
      id: user.id,
      email: user.email,
      mobile_phone: user.mobile_phone,
      fcm_token: user.fcm_token,
      entity_id: user.entity_id,
      province_id: province_id,
      regency_id: regency_id,
      patient_id: user.patient_id
    },
    message,
    title,
    type,
    action_url,
  }
  return await publishWorker('multi-notification', payload)
}