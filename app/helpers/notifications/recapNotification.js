import { Op } from 'sequelize'
import moment from 'moment-timezone'

import { publishWorker } from '../services/rabbitmqHelper'
import models from '../../models'
import { USER_ROLE, STATUS, ENTITY_TYPE } from '../constants'

function recapEmailTemplateFromDB(notifications = []) {
  const date = moment().format('DD/MM/YY')
  let header = `<h1>Events On ${date}</h1>`

  let content = ''
  let titles = [...new Set(notifications.map(item => item.title))]
  for(let title of titles) {
    let messages = notifications.filter(item => item.title === title)
    content += `<h3>${title}</h3>`
    let rows = ''
    messages.forEach(el => {
      rows += `<tr><td>${moment(el.created_at).format('DD/MM/YYYY HH:mm:ss')} - ${el.message}</td></tr>`
    })
    content += `<table>${rows}</table><br>`
  }
  return `${header}${content}`
}

async function sendNotifToUser({ users = [], content = '' }) {
  const subject = '[SMILE] Daily Notification Recap'
  for(let i = 0; i < users.length; i++) {
    let { email } = users[i]
    if(email) {
      await publishWorker('email-notification', {
        mail: email,
        subject: subject,
        content
      })
    }
  }
}

async function sendToAdmin(listNotifs = []) {
  // send all notif to admin user
  const userAdmin = await models.User.findAll({
    where: {
      role: 1,
      status: STATUS.ACTIVE
    },
    attributes: ['id', 'email']
  })
  let adminContent = recapEmailTemplateFromDB(listNotifs) 
  
  await sendNotifToUser({ users: userAdmin, content: adminContent })
}

async function sendToVendor(listNotifs = []) {
  // send notif to vendor user
  const entities = await models.Entity.findAll({
    where: {
      type: {[Op.in]: [ENTITY_TYPE.KOTA, ENTITY_TYPE.PROVINSI]}
    },
    include: [{
      association: 'users',
      attributes: ['id', 'email'],
      where: {role: {[Op.in]: [USER_ROLE.MANAGER, USER_ROLE.MANAGER_COVID]}}
    }, {
      association: 'customers',
      attributes: ['id']
    }]
  })

  for(let entity of entities) {
    let customerIds = entity.customers.map(el => el.id)
    let filterNotifs = listNotifs.filter(el => customerIds.includes(el.entity_id))
    if(filterNotifs.length > 0) {
      let content = recapEmailTemplateFromDB(filterNotifs)
      let { users } = entity
      await sendNotifToUser({ users, content })
    }
  }
}

export async function sendRecapListNotif() {
  try {
    const listNotifs = await models.Notification.findAll({
      where: {
        created_at: {
          [Op.between]: [
            moment().subtract(1, 'days'),
            moment(),
          ],
        },
      },
      group: 'message'
    })
    await sendToVendor(listNotifs)

    await sendToAdmin(listNotifs)

  } catch (err) {
    console.log(err)
    throw  err
  }
}