'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class ReconciliationItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.OpnameReason, {
        as: 'reasons',
        through: 'reconciliation_item_reason_actions',
        foreignKey: 'reconciliation_item_id',
        otherKey: 'reason_id',
        timestamps: false
      })

      this.belongsToMany(models.OpnameAction, {
        as: 'actions',
        through: 'reconciliation_item_reason_actions',
        foreignKey: 'reconciliation_item_id',
        otherKey: 'action_id',
        timestamps: false
      })

      this.hasMany(models.ReconciliationItemReasonAction, {
        as: 'reason_actions',
        foreignKey: 'reconciliation_item_id',
      })
    }
  }
  ReconciliationItem.init({
    reconciliation_id: DataTypes.INTEGER,
    stock_category: DataTypes.INTEGER,
    smile_qty: DataTypes.INTEGER,
    real_qty: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'ReconciliationItem',
    tableName: 'reconciliation_items',
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  ReconciliationItem.getBasicAttribute = function () {
    return ['id', 'reconciliation_id', 'stock_category', 'smile_qty', 'real_qty']
  }
  
  return ReconciliationItem
}