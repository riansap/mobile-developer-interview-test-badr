const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')

dotenv.config()

const invalidField = {
  'not int': 'AAAA',
  'empty': null,
  'not exists': 9999,
  'date': 'INVALID DATE',
  'invalid_date': 'INVALID DATE',
  'expired date': '2019-03-31',
  'not boolean': 'Not True',
  'not_boolean': 'Not True',
  'not_string': true,
  'invalid code': 'ZZZZZZ',
  'not string': true,
  'not match': 10,
  'piece unit': 12,
  'minus': -1,
  'positive': 1,
  'not_email': 'some-email',
  'invalid_password': 'password',
  'invalid_token': 'Bearer ',
  'expired_token': 'Bearer XXXXXXXX'

}

const generateToken = ({ userData }) => {
  const payload = {
    id: userData.id,
    username: userData.username,
    role: userData.role_id
  }
  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' })
  // console.log(token)
  return token
}

module.exports = {
  authToken: 'Bearer '+process.env.TEST_TOKEN,
  customerToken: 'Bearer '+process.env.CUSTOMER_TOKEN,
  customerID: process.env.TEST_CUSTOMER_ID || 2,
  vendorID: process.env.TEST_VENDOR_ID || 1,
  invalidField: invalidField,
  generateToken: generateToken
}