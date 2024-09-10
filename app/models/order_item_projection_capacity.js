'use strict'
const {
  Model
} = require('sequelize')


module.exports = (sequelize, DataTypes) => {
  class OrderItemProjectionCapacity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    
    static associate(models) {
      // define association here
      this.belongsTo(models.Order, { as: 'order', foreignKey: 'order_id' })
      this.belongsTo(models.OrderItem, { as: 'order_items', foreignKey: 'order_item_id' })

      this.addHook('afterCreate', async (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
      this.addHook('afterUpdate', async (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
      this.addHook('afterDestroy', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
        delete model.dataValues['deleted_at']
      })
    }
  }
  OrderItemProjectionCapacity.init({
    order_id: DataTypes.BIGINT,
    order_item_id: DataTypes.BIGINT,
    master_material_id: DataTypes.INTEGER,
    capacity_asset: DataTypes.BIGINT,
    total_volume: DataTypes.BIGINT,
    percent_capacity: DataTypes.FLOAT,
    is_confirm: DataTypes.BOOLEAN,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'OrderItemProjectionCapacity',
    tableName: 'order_item_projection_capacities',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  OrderItemProjectionCapacity.getBasicAttribute = function () {
    return [
      'order_id',
      'order_item_id',
      'master_material_id',
      'capacity_asset',
      'total_volume',
      'percent_capacity',
      'is_confirm',
      'created_by',
      'updated_by',
      'deleted_by',
    ]
  }
  OrderItemProjectionCapacity.getCapacityAttribute = function () {
    return [
      'capacity_asset',
      'total_volume',
      'percent_capacity',
      'is_confirm',
    ]
  }

  return OrderItemProjectionCapacity
}