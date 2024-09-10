'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class RequestOrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Material, { as: 'material', foreignKey: 'material_id' })
      this.belongsTo(models.RequestOrder, { as: 'request_order', foreignKey: 'request_order_id' })
    }
  }
  RequestOrderItem.init({
    request_order_id: DataTypes.BIGINT,
    material_id: DataTypes.INTEGER,
    qty: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'RequestOrderItem',
    tableName: 'request_order_items',
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  RequestOrderItem.getBasicAttribute = function() {
    return [
      'id',
      'request_order_id',
      'material_id',
      'qty',
      'created_at',
      'updated_at',
    ]
  }
  return RequestOrderItem
}