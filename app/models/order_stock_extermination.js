import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class OrderStockExtermination extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.StockExtermination, { as: 'stock_extermination', foreignKey: 'stock_extermination_id' })
      this.belongsTo(models.OrderStock, { as: 'order_stock', foreignKey: 'order_stock_id' })

    }
  }
  OrderStockExtermination.init({
    order_stock_id: DataTypes.BIGINT,
    stock_extermination_id: DataTypes.BIGINT,
    status: DataTypes.TINYINT,
    allocated_discard_qty: DataTypes.FLOAT,
    allocated_received_qty: DataTypes.FLOAT,
    received_qty: DataTypes.FLOAT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'OrderStockExtermination',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(OrderStockExtermination)

  OrderStockExtermination.getBasicAttribute = function () {
    return [
      'id',
      'order_stock_id',
      'stock_extermination_id',
      'status',
      'allocated_discard_qty',
      'allocated_received_qty',
      'received_qty',
    ]
  }

  return OrderStockExtermination
}