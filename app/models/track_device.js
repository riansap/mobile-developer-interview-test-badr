'use strict'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class TrackDevice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Entity, { as: 'entity', foreignKey: 'entity_id'})
    }
  }
  TrackDevice.init({
    nopol: DataTypes.STRING,
    mobile_phone: DataTypes.STRING,
    entity_id: DataTypes.INTEGER,
    device_number: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'TrackDevice',
    tableName: 'track_devices',
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  })

  sequelizePaginate.paginate(TrackDevice)

  return TrackDevice
}