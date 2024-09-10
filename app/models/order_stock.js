import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import { Op } from 'sequelize'
import { ORDER_STATUS } from '../helpers/constants'

export default (sequelize, DataTypes) => {
  class OrderStock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Stock, { as: 'stock' })
      this.belongsTo(models.OrderItem, { as: 'order_item' })

      this.hasMany(models.OrderStockExtermination, { as: 'order_stock_exterminations', foreignKey: 'order_stock_id'})

      this.hasOne(models.OrderStockPurchase, {
        as : 'order_stock_purchase',
        foreignKey : 'order_stock_id'
      })
    }
  }
  OrderStock.init({
    order_item_id: DataTypes.BIGINT,
    stock_id: DataTypes.BIGINT,
    status: DataTypes.TINYINT,
    allocated_qty: DataTypes.FLOAT,
    received_qty: DataTypes.FLOAT,
    ordered_qty: DataTypes.FLOAT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    fulfill_reason: DataTypes.TINYINT,
    other_reason: DataTypes.STRING,
    qrcode: DataTypes.STRING,
    fulfill_status: DataTypes.TINYINT
  }, {
    sequelize,
    modelName: 'OrderStock',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(OrderStock)

  OrderStock.getBasicAttribute = function () {
    return [
      'id',
      'order_item_id',
      'stock_id',
      'status',
      'allocated_qty',
      'received_qty',
      'ordered_qty',
      'fulfill_reason',
      'other_reason',
      'qrcode',
      'fulfill_status'
    ]
  }

  OrderStock.addScope('allocated', {
    include: {
      association: 'order_item',
      attributes: [],
      without_relations: true,
      required: true,
      include: {
        association: 'order',
        attributes: [],
        without_relations: true,
        required: true,
        where: { 
          status: ORDER_STATUS.ALLOCATED
        }
      }
    }
  })
  return OrderStock
}