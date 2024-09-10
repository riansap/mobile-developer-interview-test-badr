import models from '../models'
import { CONFIGURATIONS, parseConfigValue } from '../helpers/config'

const { Configuration } = models

export async function freezeTransactions(req, res) {
  let { freeze } = req.body
  let configKey = CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.dbKey
  let config = await Configuration.findOrCreate({
    where: {
      key: configKey,
    }, defaults: {
      key: configKey,
      value: freeze ?? false,
    },
  }).then(([config]) => config)
    .catch(err => {
      console.log(err.message)
      return null
    })
  let value = null
  if (config) {
    config.value = freeze ?? false
    await config.save()
    value = parseConfigValue(config.value, CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.type)
  }
  res.status(200).json({
    'freeze': value,
    'message': 'OK',
  })
}

export async function freezeTransactionsStatus(req, res) {
  let configKey = CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.dbKey
  let config = await Configuration.findOne({
    where: {
      key: configKey,
    },
  })
  let value = null
  if (config) {
    value = parseConfigValue(config.value, CONFIGURATIONS.FREEZE_TRANSACTION_ACCESS.type)
  }
  res.status(200).json({
    'freeze': value,
    'message': 'OK',
  })
}
