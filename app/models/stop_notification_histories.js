'use strict'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class StopNotificationHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        this.belongsTo(models.Patient, {as : 'patient', foreignKey: 'patient_id'})
        this.belongsTo(models.StopNotificationReason, {as : 'reason', foreignKey: 'reason_id'})
        this.belongsTo(models.User, {as : 'user_created', foreignKey: 'created_by'})
        this.belongsTo(models.User, {as : 'user_updated', foreignKey: 'updated_by'})
    }
  }

  StopNotificationHistory.init({
    patient_id: DataTypes.BIGINT,
    reason_id: DataTypes.INTEGER,
    stop_status: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'StopNotificationHistory',
    tableName: 'stop_notification_histories',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  return StopNotificationHistory
}