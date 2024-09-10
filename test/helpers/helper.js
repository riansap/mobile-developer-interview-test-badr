import { Op } from 'sequelize'

import models from '../../app/models'
import moment from 'moment'
import jwt from 'jsonwebtoken'

export async function doLogin(roleID) {
  let login = await models.User.findOne({
    where: {
      role: roleID
    },
  })
  if (!login) {
    login = await models.User.create({
      username: `user_test_role_${roleID}`,
      role: roleID,
      province_id: 31,
      regency_id: 3171,
    })
  }
  const payload = {
    id: login.id,
    username: login.username,
    role: login.role,
    province_id: login?.entity?.province_id,
    regency_id: login?.entity?.regency_id,
    sub_district_id: login?.entity?.sub_district_id,
  }

  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' })
  login.token_login = token
  login.last_login = moment().format('YYYY-MM-DD HH:mm:ss')
  await login.save()

  return login
}

export async function getToken(roleID) {
  const yesterday = moment().subtract(7, 'days').format('YYYY-MM-DD')
  let user = await models.User.findOne({
    where: [
      { role: roleID }, 
      { token_login: {[Op.not]: null } },
      { last_login: {[Op.gte]: yesterday} }
    ],
    order: [['last_login', 'DESC']],
    attributes: ['id', 'token_login']
  })
  // check last login date
  if(!user) {
    user = await doLogin(roleID)
  }

  return 'Bearer ' + user.token_login
}