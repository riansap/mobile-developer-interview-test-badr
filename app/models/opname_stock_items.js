'use strict'
const {
  Model
} = require('sequelize')
const { getOpnameCategoryLabel } = require('../helpers/constants')
module.exports = (sequelize, DataTypes) => {
  class OpnameStockItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // opname_item_reason_actions
      this.belongsToMany(models.OpnameReason, {
        as: 'reasons',
        through: 'opname_item_reason_actions',
        foreignKey: 'opname_stock_item_id',
        otherKey: 'opname_reason_id',
        timestamps: false
      })

      this.belongsToMany(models.OpnameAction, {
        as: 'actions',
        through: 'opname_item_reason_actions',
        foreignKey: 'opname_stock_item_id',
        otherKey: 'opname_action_id',
        timestamps: false
      })
    }
  }
  OpnameStockItem.init({
    opname_stock_id: DataTypes.INTEGER,
    stock_category: DataTypes.INTEGER,
    smile_qty: DataTypes.INTEGER,
    real_qty: DataTypes.INTEGER,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    deleted_at: DataTypes.DATE,
    stock_category_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getOpnameCategoryLabel(this.stock_category)
      }
    },
  }, {
    sequelize,
    modelName: 'OpnameStockItem',
    tableName: 'opname_stock_items',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })
  return OpnameStockItem
}