/* eslint-disable no-unused-vars */
'use strict'
const {
  Model, DataTypes
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {

  class AssetModelIot extends Model{
    static associate(models){
      
    }
  }
  AssetModelIot.init({
    name: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    updated_by: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER,
    only_logger: DataTypes.TINYINT,
    capacity_gross : DataTypes.DOUBLE,
    capacity_nett : DataTypes.DOUBLE
  }, {
    paranoid: true,
    sequelize,
    tableName: 'asset_model',
    modelName: 'AssetModelIot',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    schema: process.env.DB_IOT || 'staging_smile_iot'
  })

  return AssetModelIot
}