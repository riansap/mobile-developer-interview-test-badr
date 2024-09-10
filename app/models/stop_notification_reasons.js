'use strict'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class StopNotificationReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    }
  }

  StopNotificationReason.init({
    title: DataTypes.STRING,
    type: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'StopNotificationReason',
    tableName: 'stop_notification_reasons',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  return StopNotificationReason
}