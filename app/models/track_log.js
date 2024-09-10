'use strict'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')
export default (sequelize, DataTypes) => {
  class TrackingLog extends Model{
    static associate(models){
    }
  }
  TrackingLog.init({
    nopol: DataTypes.STRING,
    status_do:DataTypes.INTEGER,
    curr_temp: DataTypes.DOUBLE,
    lat: DataTypes.DOUBLE,
    lon: DataTypes.DOUBLE,
    is_alarm: DataTypes.INTEGER,
    updated_time: DataTypes.STRING,
    vehicle_status: DataTypes.INTEGER,
    no_do: DataTypes.STRING
  }, {
    paranoid: true,
    sequelize,
    tableName: 'tracking_log_eg',
    modelName: 'TrackingLog',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(TrackingLog)

  return TrackingLog
}