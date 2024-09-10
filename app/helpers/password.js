import bcrypt from 'bcryptjs'

export function getHash(password) {
  const salt = bcrypt.genSaltSync(10)
  return bcrypt.hashSync(password, salt)
}

export function checkHash(password, hash) {
  return bcrypt.compareSync(password, hash)
}