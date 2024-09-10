import moment from 'moment-timezone'
import crypto from 'crypto'

export const parsingArrIds = (str) => {
  let result = String(str).split(',')
  result = result.map((item) => Number(String(item).trim()))
  return result
}

export const groupByKey = (arr, key) =>
  arr.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(
      currentValue
    )

    return result
  }, {})

export const leadZeroNumber = function (number) {
  return new Array(+2 + 1 - `${number}`.length).join('0') + number
}

export function formatWIB(date, format = 'YYYY-MM-DD HH:mm:ss') {
  return date ? moment(date).tz('Asia/Jakarta').format(format) : ''
}

export function formatDecimal(number) {
  return Math.round(number * 100) / 100
}

export function numToSSColumn(num) {
  // return num
  let s = ''
  let t = null

  while (num > 0) {
    t = (num - 1) % 26
    s = String.fromCharCode(65 + t) + s
    num = ((num - t) / 26) | 0
  }
  return s || undefined
}

export function formatRelationsCount(include, condition) {
  // if (include && typeof include === 'object') include = include
  let conditionArray = []
  let includeArray = []

  if (Array.isArray(include)) includeArray = include
  else if (typeof include === 'object') includeArray.push(include)
  if (Array.isArray(condition)) conditionArray = condition
  else if (typeof condition === 'object') {
    Object.keys(condition).forEach((key) => {
      let obj = {}
      obj[key] = condition[key]
      conditionArray.push(obj)
    })
  }

  const keepRelations = []
  conditionArray.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key.includes('$')) {
        const tableRelationName = key.split('.')[0]?.replace('$', '') || ''
        keepRelations.push(tableRelationName)
      }
    })
  })

  const finalRelations = []
  includeArray.forEach((relation) => {
    if (
      relation.where !== undefined ||
      keepRelations.includes(relation.association) ||
      keepRelations.includes(relation.as) ||
      relation.requiredOnCount === true
    ) {
      finalRelations.push(relation)
    } else if (
      relation.include !== undefined &&
      isRelationHasWhere(relation.include)
    ) {
      finalRelations.push(relation)
    }
  })
  return finalRelations
}

function isRelationHasWhere(relation = []) {
  let hasWhere = false
  let relationArray = []
  if (Array.isArray(relation)) relationArray = relation
  else if (typeof relation === 'object') relationArray.push(relation)

  relationArray.forEach((obj) => {
    if (obj.where !== undefined) {
      hasWhere = true
    } else if (obj.include !== undefined) {
      hasWhere = isRelationHasWhere(obj.include)
    }
  })
  return hasWhere
}

export function isMultipleValue(qty1, qty2) {
  if (qty1 === 0) return true
  return Number(qty1) % Number(qty2) === 0
}

export function convertStringToArray(string, delimiter = ',') {
  return typeof string === 'string' && string !== ''
    ? string.split(delimiter)
    : []
}

export function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

export function translateHeadersToEnglish(name) {
  const vocabs = {
    'bayi lahir hidup': 'Babies Born Alive',
    'bayi lahir hidup (cek)': 'Babies Born Alive (Check)',
    'bayi surviving infant': 'Surviving Infants',
    'anak baduta': 'Toddlers (2 years old)',
    'murid kelas 1 sd': 'First Grade Elementary School Students',
    'murid kelas 2 sd': 'Second Grade Elementary School Students',
    'murid kelas 5 sd': 'Fifth Grade Elementary School Students',
    'murid wanita kelas 5 sd': 'Female Fifth Grade Elementary School Students',
    'murid wanita kelas 6 sd': 'Female Sixth Grade Elementary School Students',
    'wanita usia subur (termasuk ibu hamil)': 'Women of Childbearing Age',
    puskesmas: 'Public Health Center',
  }

  return vocabs[name.toLowerCase().trim()] || name
}

export const filterLeveling = ({
  data = [],
  filters,
  defaultResult = {
    code_kfa_ingredients: null,
    code_kfa_product_template: null,
    code_kfa_product_variant: null,
    code_kfa_packaging: null,
  },
}) => {
  const objData = Object.assign({}, ...data)

  let shouldIgnore = false

  for (const filter of filters) {
    const value = objData[filter.key]

    if (!shouldIgnore) {
      defaultResult[filter.key] = value
    }

    if (value) {
      shouldIgnore = true
    }
  }

  return defaultResult
}

export const noMinus = (number) => (number > 0) ? number : 0


export const doEncrypt = (text) => {
  try {
    const iv = process.env.IV_KEY
    const encKey = process.env.ENCRYPT_KEY
    let cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv)
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return encrypted
  } catch (err) {
    throw Error('Failed to encrypt the text')
  }
}

export const doDecrypt = (encrypted) => {
  try {
    const iv = process.env.IV_KEY
    const encKey = process.env.ENCRYPT_KEY
    let decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv)
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    throw Error('Failed to decrypt the text')
  }
}

export const hideSomeCharacters = (text)=>{
  if(!text) return ''
  let halfLen = Math.floor(text.length/2)
  let textArr = text.split('').map((ch, index)=>{
    return index>=halfLen ? '*' : ch
  })

  return textArr.join('')
}

export const pagination = (array, limit, page) => {
  return array.slice((page - 1) * limit, page * limit)
}