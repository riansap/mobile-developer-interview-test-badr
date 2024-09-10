'use strict'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class StockExtermination extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Stock, {
        as: 'stock',
        foreignKey: 'stock_id'
      })

      this.belongsTo(models.TransactionReason, {
        as: 'transaction_reason',
        foreignKey: 'transaction_reason_id'
      })
    }
  }

  StockExtermination.init({
    stock_id: DataTypes.BIGINT,
    transaction_reason_id: DataTypes.INTEGER,
    extermination_discard_qty: DataTypes.DOUBLE,
    extermination_received_qty: DataTypes.DOUBLE,
    extermination_qty: DataTypes.DOUBLE,
    extermination_shipped_qty: DataTypes.DOUBLE,
    extermination_ready_qty: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.extermination_discard_qty + this.extermination_received_qty
      }
    },
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'StockExtermination',
    tableName: 'stock_exterminations'
  })

  sequelizePaginate.paginate(StockExtermination)

  StockExtermination.getBasicAttributes = () => [
    'id',
    'stock_id',
    'transaction_reason_id',
    'extermination_discard_qty',
    'extermination_received_qty',
    'extermination_qty',
    'extermination_shipped_qty',
    'extermination_ready_qty',
  ]

  return StockExtermination
}
