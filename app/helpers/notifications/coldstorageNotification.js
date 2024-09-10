import models from '../../models'

import { STATUS, NOTIFICATION_TYPE } from '../constants'
import { sendMultiNotif } from './notificationService'


export async function generateCapacityNotification(coldstorage){
  try{

    const entity = await models.Entity.findByPk(coldstorage.entity_id)

    const users = await models.User.findAll({
      where : {entity_id : coldstorage.entity_id, status : STATUS.ACTIVE}
    })

    const payload = {
      message : `SMILE-ID kapasitas kulkas di ${entity.name} telah mencapai ${coldstorage.percentage_capacity}%.`,
      title : `Cold Storage Capacity ${entity.name}`,
      type : NOTIFICATION_TYPE.CAPACITY_80,
      action_url : null,
      media : ['fcm']
    }

    if(users.length>0){
      for(const user of users){
        const notifPayload = {
          ...payload,
          user: user,
          province_id : entity.province_id,
          regency_id : entity.regency_id
        }
        await sendMultiNotif(notifPayload)
      }
    }
  }catch(err){
    console.log(err)
  }
}
