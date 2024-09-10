import axios from 'axios'
import moment from 'moment'

import models from '../../models'

const SMILE_URL = process.env.SMILE_URL

export async function getSmileHeader(username, password) {
  const user = await models.User.findOne({
    where: { username: username },
    attributes: ['token_login', 'last_login', 'username', 'id']
  })
  const today = moment()
  const lastLogin = moment(user?.last_login || null)
  
  let token = user?.token_login || null
  if(today.diff(lastLogin, 'days') > 4 || token === null) {
    // generate new token
    const smileLogin = await axios({
      method: 'POST',
      url: `${SMILE_URL}/auth/login`,
      data: {
        username: username,
        password: password
      }
    })
    token = smileLogin.data.token_login
  }
  return {
    Authorization: `Bearer ${token}`
  }
}  