'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Reconciliation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // this.hasMany(models.OpnameStockItem, {
      //   as: 'opname_stock_items',
      //   foreignKey: 'opname_stock_id'
      // })

      this.belongsTo(models.Entity, { 
        as: 'entity', 
        foreignKey: 'entity_id'
      })

      this.belongsTo(models.MasterMaterial, { 
        as: 'material', 
        foreignKey: 'master_material_id'
      })

      this.belongsTo(models.MasterActivity, { 
        as: 'activity', 
        foreignKey: 'activity_id'
      })

      this.hasMany(models.ReconciliationItem, {
        as: 'reconciliation_items',
        foreignKey: 'reconciliation_id'
      })

      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['created_by', 'updated_by', 'deleted_by']
      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })
      
    }
  }
  Reconciliation.init({
    master_material_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    activity_id: DataTypes.INTEGER,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'Reconciliation',
    tableName: 'reconciliation',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  Reconciliation.getBasicAttribute = function () {
    return [
      'id',
      'master_material_id',
      'entity_id',
      'activity_id',
      'start_date',
      'end_date',
      'created_by',
      'created_at',
    ]
  }

  return Reconciliation
}