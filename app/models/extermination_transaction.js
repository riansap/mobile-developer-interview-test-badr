'use strict'
import { Op } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {

  class ExterminationTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.ExterminationFlow, {
        as: 'flow',
        foreignKey: 'flow_id'
      })
      this.hasOne(models.CustomerVendor, {
        as: 'customer_vendor',
        foreignKey: 'customer_id',
        sourceKey: 'customer_id',
        scope: {
          [Op.and]: sequelize.where(sequelize.col('customer_vendor.vendor_id'), '=', sequelize.col('Transaction.entity_id'))
        }
      })
      this.belongsTo(models.Order, {
        as: 'order',
        foreignKey: 'order_id'
      })
      this.belongsTo(models.Material, {
        as: 'material',
        foreignKey: 'material_id'
      })

      this.belongsTo(models.ExterminationTransactionType, {
        as: 'extermination_transaction_type',
        foreignKey: 'extermination_transaction_type_id'
      })
      this.belongsTo(models.Entity, {
        as: 'customer',
        foreignKey: 'customer_id'
      })
      this.belongsTo(models.Entity, {
        as: 'vendor',
        foreignKey: 'vendor_id'
      })
      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey: 'entity_id'
      })
      this.belongsTo(models.User, {
        as: 'user_created',
        foreignKey: 'created_by'
      })
      this.belongsTo(models.User, {
        as: 'user_updated',
        foreignKey: 'updated_by'
      })
      this.belongsTo(models.StockExtermination, {
        as: 'stock_extermination',
        foreignKey: 'stock_extermination_id',
      })
      this.hasOne(models.TransactionInjection, {
        as: 'injection',
        foreignKey: 'transaction_id',
      })

      this.belongsTo(models.MasterMaterial, {
        as: 'master_material',
        foreignKey: 'master_material_id'
      })

      this.belongsTo(models.MasterActivity, {
        as: 'activity',
        foreignKey: 'activity_id'
      })
    }
  }
  ExterminationTransaction.init({
    extermination_transaction_type_id: DataTypes.INTEGER,
    flow_id: DataTypes.BIGINT,
    material_id: DataTypes.INTEGER,
    master_material_id: DataTypes.INTEGER,
    activity_id: DataTypes.INTEGER,
    customer_id: DataTypes.INTEGER,
    vendor_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    stock_extermination_id: DataTypes.BIGINT,
    order_id: DataTypes.BIGINT,
    opening_qty: DataTypes.DOUBLE,
    change_qty: DataTypes.DOUBLE,
    open_vial: DataTypes.DOUBLE,
    close_vial: DataTypes.DOUBLE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    closing_qty: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.extermination_transaction_type_id == 3 ? this.opening_qty + this.change_qty : this.opening_qty - Math.abs(this.change_qty)
      },
    }
  }, {
    sequelize,
    modelName: 'ExterminationTransaction',
    tableName: 'extermination_transactions',
    paranoid: true,
    deletedAt: 'deleted_at',
  })

  ExterminationTransaction.getVirtualAttribute = function () {
    return [
      'created_at',
      'updated_at',
      'closing_qty',
      'change_qty',
      'entity_name',
      'order_type',
    ]
  }

  sequelizePaginate.paginate(ExterminationTransaction)

  return ExterminationTransaction
}
