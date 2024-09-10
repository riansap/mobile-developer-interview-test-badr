/* eslint-disable no-unused-vars */
'use strict'
const {
  Model, DataTypes
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {

  class AssetTypeIot extends Model{
    static associate(models){

    }
  }
  AssetTypeIot.init({
    name: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    updated_by: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER,
    min_temp : DataTypes.DOUBLE,
    max_temp : DataTypes.DOUBLE,
    is_coldstorage : DataTypes.TINYINT,
  }, {
    paranoid: true,
    sequelize,
    tableName: 'asset_type',
    modelName: 'AssetTypeIot',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    schema: process.env.DB_IOT || 'staging_smile_iot'
  })

  return AssetTypeIot
}