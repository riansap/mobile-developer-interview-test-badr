/* eslint-disable */
'use strict'
const {
  Model, DataTypes
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class AssetIot extends Model {
    static associate(models) {
      this.belongsTo(models.Entity, { as: 'entity', foreignKey: 'entity_id' })
      this.belongsTo(models.AssetTypeIot, {as : 'asset_type', foreignKey : 'type_id'})
      this.belongsTo(models.AssetModelIot, {
        as: 'asset_model',
        foreignKey: 'model_id'
      })

      this.belongsTo(models.AssetStatusIot, {
        as : 'asset_status',
        foreignKey : 'working_status_id'
      })
    }
  }
  AssetIot.init({
    serial_number: DataTypes.STRING,
    prod_year: DataTypes.STRING,
    temp: DataTypes.STRING,
    manufacture_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    type_id: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    lat: DataTypes.FLOAT,
    lng: DataTypes.FLOAT,
    model_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    domain_name: DataTypes.STRING,
    activity_status: DataTypes.INTEGER,
    activity_time: DataTypes.DATE,
    activity_duration: DataTypes.INTEGER,
    alarm_status: DataTypes.INTEGER,
    alarm_type: DataTypes.INTEGER,
    alarm_updated_at: DataTypes.DATE,
    alarm_duration: DataTypes.INTEGER,
    power_available: DataTypes.INTEGER,
    power_updated_at: DataTypes.DATE,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER,
    working_status: DataTypes.STRING,
    parent_id: DataTypes.INTEGER,
    child_pos: DataTypes.INTEGER,
    budget_year: DataTypes.INTEGER,
    budget_src: DataTypes.TINYINT,
    other_type_asset: DataTypes.STRING,
    other_min_temp: DataTypes.DOUBLE,
    other_max_temp: DataTypes.DOUBLE,
    other_model_asset: DataTypes.STRING,
    other_capacity_nett: DataTypes.DOUBLE,
    other_capacity_gross: DataTypes.DOUBLE,
    other_manufacture: DataTypes.STRING,
    other_budget_src: DataTypes.STRING,
    unused_reason_id: DataTypes.INTEGER,
    is_stock_opname: DataTypes.TINYINT,
    working_status_id: DataTypes.INTEGER
  }, {
    paranoid: true,
    sequelize,
    tableName: 'assets',
    modelName: 'AssetIot',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    schema: process.env.DB_IOT || 'staging_smile_iot'
  })

  AssetIot.getBasicAttribute = function () {
    return [
      'id',
      'asset_name',
      'serial_number',
      'manufacture_id',
      'type_id',
      'model_id',
      'child_pos',
      'budget_year',
      'budget_src',
      'min_temp',
      'max_temp',
      'other_model_asset',
      'other_manufacture'
    ]
  }
  return AssetIot
}
