import { Op } from 'sequelize'

import { recapNotification, sendMultiNotif } from './notificationService'
import { generateUrl } from '../services/shortenUrlHelper'
import models from '../../models'
import { ENTITY_TYPE, STATUS, USER_ROLE } from '../constants'

function getExpiredDayLeft(expiredDate) {
  const today = new Date()
  return Math.floor((expiredDate - today)/(1000*60*60*24))
}

async function sendNotifToAdmin({ expireDayLeft, message='', users= [], actionUrl = null }) {
  for(const user of users) {
    if(message !== '') {
      await sendMultiNotif({
        user,
        province_id: user.entity.province_id,
        regency_id: user.entity.regency_id,
        message,
        title: `Batch Expired ${expireDayLeft}`,
        type: `ed-${expireDayLeft}`,
        action_url: actionUrl,
        media: ['whatsapp', 'fcm']
      })
    }
  }
}

async function getAdminURL({province, regency, material, batch}){
  const params = [
    `material_id=${material.id}`,
    `material_label=${encodeURIComponent(material.name)}`,
    `province_id=${province.id}`,
    `province_label=${encodeURIComponent(province.name)}`,
    `batch_id=${batch.id}`,
    `batch_label=${batch.code}`,
  ]
  if(regency) {
    params.push(`regency_id=${regency.id}`)
    params.push(`regency_label=${encodeURIComponent(regency.name)}`)
  }

  const query = params.join('&')
  let url = `${process.env.FE_URL}/id/stock/v2?${query}`
  return await generateUrl(url)
}

async function getAdminMessage({ material, activity, batch, province, regency = null, entityStocks = []}) {
  const expiredDate = batch.expired_date
  const expireDayLeft = getExpiredDayLeft(expiredDate)
  let url = ''
  let linkMessage = ''
  try {
    url = await getAdminURL({ province, regency, material, batch })
    linkMessage = `, lebih lengkap cek di ${url}`
  } catch (e) {
    console.error(e)
  }

  let expiredDayMessage = `dalam ${expireDayLeft} hari`
  if (expireDayLeft === 0) expiredDayMessage = 'hari ini'

  return {
    actionUrl: url,
    expireDayLeft,
    message: `SMILE-ID ${material.name} ${activity?.name} Batch ${batch.code} akan kadaluwarsa ${expiredDayMessage} di ${entityStocks.join(', ')}${linkMessage}`
  }
}

async function getUserAdmin({ provinceId, regencyId = null }) {
  const entityCondition = {
    province_id: provinceId,
    type: ENTITY_TYPE.PROVINSI
  }
  if(regencyId) {
    entityCondition['regency_id'] = regencyId
    entityCondition['type'] = ENTITY_TYPE.KOTA
  }
  return await models.User.findAll({
    where: {
      status: STATUS.ACTIVE,
      role: {
        [Op.in]: [USER_ROLE.MANAGER, USER_ROLE.MANAGER_COVID]
      }
    },
    include: [{
      association: 'entity',
      where: entityCondition,
      required: true
    }]
  })
}
  
export async function batchNotification(stock) {
  try {
    // notify batch expired to its entity
    const { batch, entity_master_material, activity } = stock

    const expiredDate = batch.expired_date
    const expireDayLeft = getExpiredDayLeft(expiredDate)
  
    const entity = entity_master_material.entity
    const material = entity_master_material.material

    let notifications = []
    let expired = false

    let dataNotif = []

    const message = `SMILE-ID ${material.name} ${activity?.name} dengan batch ${batch.code} di fasilitas ${entity?.name || ''} akan kadaluwarsa dalam `
    if (expireDayLeft <= 30) {
      expired = true
    }
    if(expired) {
      notifications.push(
        message + `${expireDayLeft} hari`
      )
    }

    if(notifications.length > 0) {
      const users = await entity.getUsers({
        where: { status: 1 }
      })
      let vendorIds = []
      if(entity) vendorIds = await entity.getVendors()
      const title = 'Batch expired'
      for(let i = 0; i<users.length;i++) {
        let user = users[i]
        for(let j=0; j<notifications.length;j++) {
          let text = notifications[j]
          if(text !== '') {
            const payloadNotif = {
              user,
              province_id: entity.province_id,
              regency_id: entity.regency_id,
              message: text,
              title: `Batch Expired ${expireDayLeft}`,
              type: `ed-${expireDayLeft}`,
              media: ['fcm']
            }

            dataNotif.push(payloadNotif)

            await sendMultiNotif(payloadNotif)
        
            for(let j = 0; j < vendorIds.length; j++) {
              await recapNotification({
                entity_id: vendorIds[j].id,
                title: title,
                message: text
              })
            }
          }
        }
      }
    }

    return dataNotif
      
  } catch (err) {
    console.log(err)
    throw  err
  }
  
}
  
export async function batchManagerNotification(stock) {
  // notify batch expired to vendor entity
  try {
    const { batch, material, provEntities, otherEntities, activity } = stock

    // if expired occur in province type
    for(let provEntity of provEntities) {
      const provinceStock = [
        `${provEntity.name} ${provEntity.stock.qty}`
      ]
      const { message: provinceMessage, expireDayLeft, actionUrl } = await getAdminMessage({
        material, 
        batch, 
        province: provEntity.province, 
        regency: null, 
        entityStocks: provinceStock,
        activity
      })
      
      const userProvinces = await getUserAdmin({provinceId: provEntity.province_id})
      await sendNotifToAdmin({
        message: provinceMessage,
        users: userProvinces,
        expireDayLeft,
        actionUrl
      })
    }

    // other type
    for(let otherEntity of otherEntities) {
      const { stocks, provinceId, regencyId, province, regency } = otherEntity
      const entityAndStock = []
      for(let el of stocks) {
        entityAndStock.push(`${el.name} ${el.stock.qty}`)
      }
      const { message: cityMessage, expireDayLeft, actionUrl } = await getAdminMessage({ 
        material, 
        batch, 
        province, 
        regency, 
        entityStocks: entityAndStock,
        activity
      })
      
      // send notif to province & kota
      const userProvinces = await getUserAdmin({provinceId})
      const userCities = await getUserAdmin({provinceId, regencyId})

      await sendNotifToAdmin({
        message: cityMessage,
        users: userCities,
        expireDayLeft, 
        actionUrl
      })
      await sendNotifToAdmin({
        message: cityMessage,
        users: userProvinces,
        expireDayLeft, 
        actionUrl
      })
    }
    
  } catch(err) {
    console.log(err)
    throw err
  }
}