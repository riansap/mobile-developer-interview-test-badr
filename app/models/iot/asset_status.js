/* eslint-disable no-unused-vars */
'use strict'
const {
  Model, DataTypes
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {

  
  class AssetStatusIot extends Model{
    static associate(models){

    }
  }
  AssetStatusIot.init({
    name : DataTypes.STRING,
    reason_type : DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    is_coldstorage: DataTypes.TINYINT
  }, {
    paranoid: true,
    sequelize,
    tableName: 'asset_status',
    modelName: 'AssetStatusIot',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    schema: process.env.DB_IOT || 'staging_smile_iot'
  })

  return AssetStatusIot
}