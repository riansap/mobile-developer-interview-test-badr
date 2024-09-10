'use strict'

import Sequelize from 'sequelize'
import cfg from '../../config/database'
import models from './models'
import notifModels from './notification/models'
import iotModels from './iot/models'
import dotenv from 'dotenv'
const sequelizeStream = require('node-sequelize-stream')

dotenv.config()

const env = process.env.NODE_ENV.trim() || 'development'
const config = cfg[env]
const db = {}

let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config)
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config)
}


for (const key in models) {
  if (models.hasOwnProperty(key)) {
    const model = models[key](sequelize, Sequelize.DataTypes)
    db[model.name] = model
  }
}

sequelizeStream(sequelize)

/* get models from Notifications */
let sequelizeNotif = new Sequelize(process.env.DB_NOTIFICATION, config.username, config.password, config)
sequelizeNotif.dialect.supports.schemas = true
for (const key in notifModels) {
  if (notifModels.hasOwnProperty(key)) {
    const model = notifModels[key](sequelizeNotif, Sequelize.DataTypes)
    db[model.name] = model
  }
}

/* get models from IOT */
let sequelizeIOT = new Sequelize(process.env.DB_IOT || 'staging_smile_iot', config.username, config.password, config)
sequelizeIOT.dialect.supports.schemas = true
for(const key in iotModels){
  if(iotModels.hasOwnProperty(key)){
    const model = iotModels[key](sequelizeIOT, Sequelize.DataTypes)
    db[model.name] = model
  }
}

let sequelizeWH = new Sequelize(process.env.DB_WAREHOUSE || 'staging_smile_warehouse', config.username, config.password, config)
sequelizeWH.dialect.supports.schemas = true


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize
db.sequelizeWH = sequelizeWH
db.sequelizeIOT = sequelizeIOT

export default db
