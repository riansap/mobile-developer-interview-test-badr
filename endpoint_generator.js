const fs = require('fs')
const router = require('./app/routes')
const { stack } = router.default || {}
require('dotenv').config()

const _BACKEND_HOST = {
  development: 'http://172.28.0.24:6002',
  production: ''
}
const _DIRECTORY = {
  development: {
    FILE_NAME: 'endpoint.json',
    DIR: '/home/devel/smile-krakend/config/settings'
  },
  production: {
    FILE_NAME: 'endpoint.json',
    DIR: ''
  },
}

const BACKEND_HOST = _BACKEND_HOST[process.env.NODE_ENV || 'development']
const DIR = _DIRECTORY[process.env.NODE_ENV || 'development'].DIR
const FILE_NAME = _DIRECTORY[process.env.NODE_ENV || 'development'].FILE_NAME

const TYPE_API = 'main-api'

const apiArr = []

function print(path, layer) {
  let result = '';
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
  } else if (layer.method) {
    const str1 = layer.method.toUpperCase()
    let str2 = path.concat(split(layer.regexp)).filter(Boolean).join('/')
    str2 = String(str2).replace(':id', '{id}')
    const check = apiArr.find(item => (item.endpoint === `/${str2}` && item.method === str1))
    if (!check && str2 !== '') {
      apiArr.push({
        endpoint: `/${str2}`,
        method: str1,
        backend_hosts: [BACKEND_HOST],
        backend_path: `/${str2}`,
        type: TYPE_API
      });
    }
  }

  return result;
}

function split(thing) {
  if (typeof thing === 'string') {
    return thing.split('/')
  } else if (thing.fast_slash) {
    return ''
  } else {
    const match = thing.toString()
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '$')
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\\/]|[^.*+?^${}()|[\]\\\/])*)\$\//)
    if (match) {
      return match[1].replace(/\\(.)/g, '$1').split('/')
    }
    return null
  }
}

stack.forEach(print.bind(null, []))

let fileExists = fs.existsSync(`${DIR}/${FILE_NAME}`)

if (!fileExists) {
  fs.mkdirSync(DIR, {  recursive: true })
  fs.writeFileSync(`${DIR}/${FILE_NAME}`, JSON.stringify({ group: apiArr }, null, 4))
} else {
  const data = require(`${DIR}/${FILE_NAME}`)
  let { group } = data
  if (Array.isArray(group)) {
    const prev = group.filter(item => item.type !== TYPE_API)
    group = [...prev, ...apiArr]
  } else group = apiArr

  fs.writeFileSync(`${DIR}/${FILE_NAME}`, JSON.stringify({ group }, null, 4))
}

process.exit()