'use strict'
import { Op } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {

  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.CustomerVendor, {
        as: 'customer_vendor',
        foreignKey: 'customer_id',
        sourceKey: 'customer_id',
        scope: {
          [Op.and]: sequelize.where(sequelize.col('customer_vendor.vendor_id'), '=', sequelize.col('Transaction.entity_id'))
        }
      })

      this.hasOne(models.TransactionPurchase, {
        as : 'transaction_purchase',
        foreignKey : 'transaction_id'
      })

      this.belongsTo(models.Order, {
        as: 'order',
        foreignKey: 'order_id'
      })
      this.belongsTo(models.Material, {
        as: 'material',
        foreignKey: 'material_id'
      })

      this.belongsTo(models.TransactionType, {
        as: 'transaction_type',
        foreignKey: 'transaction_type_id'
      })
      this.belongsTo(models.TransactionReason, {
        as: 'transaction_reason',
        foreignKey: 'transaction_reason_id'
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
      this.belongsTo(models.Stock, {
        as: 'stock',
        foreignKey: 'stock_id',
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

      this.hasOne(models.MappingCancelDiscard, {
        as : 'mapping_discard',
        foreignKey : 'transaction_discard_id'
      })

      this.hasOne(models.MappingCancelDiscard, {
        as : 'mapping_cancel_discard',
        foreignKey : 'transaction_cancel_discard_id'
      })

      this.belongsTo(models.Patient, {
        as : 'patient',
        foreignKey : 'patient_id'
      })

      this.hasMany(models.TransactionPatient, {
        as : 'transaction_patients',
        foreignKey: 'transaction_id'
      })
    }
  }
  Transaction.init({
    material_id: DataTypes.INTEGER,
    customer_id: DataTypes.INTEGER,
    vendor_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    stock_id: DataTypes.BIGINT,
    opening_qty: DataTypes.DOUBLE,
    transaction_type_id: DataTypes.INTEGER,
    transaction_reason_id: DataTypes.INTEGER,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    device_type: DataTypes.SMALLINT,
    order_id: DataTypes.BIGINT,
    other_reason: DataTypes.STRING,
    dose_1: DataTypes.INTEGER,
    dose_2: DataTypes.INTEGER,
    booster: DataTypes.INTEGER,
    master_material_id: DataTypes.INTEGER,
    activity_id: DataTypes.INTEGER,
    patient_id : DataTypes.BIGINT,
    created_at: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.createdAt
      }
    },
    updated_at: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.updatedAt
      }
    },
    closing_qty: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.transaction_type?.can_restock) {
          return this.change_qty
        } else if (this.transaction_type?.can_remove) {
          return this.opening_qty - this.change_qty
        } else {
          return this.opening_qty + this.change_qty
        }
      },
      set(value) {
        throw new Error('Do not try to set the `fullName` value!')
      }
    },
    change_qty: {
      type: DataTypes.DOUBLE,
      get() {
        const realQty = this.getDataValue('change_qty')
        return Math.abs(realQty)
      }
    },
    entity_name: {
      type: DataTypes.VIRTUAL,
      get() {
        if(this.entity) return this.entity.name
        return ''
      }
    },
    material_name: {
      type: DataTypes.VIRTUAL,
      get() {
        if(this.material) return this.material.name
        return ''
      }
    },
    order_type: {
      type: DataTypes.VIRTUAL,
      get() {
        if(this.order) return this.order.type
        return ''
      }
    },
    open_vial: {
      type: DataTypes.INTEGER,
      get() {
        const realOpenVial = this.getDataValue('open_vial')
        return Math.abs(realOpenVial)
      }
    },
    close_vial: {
      type: DataTypes.INTEGER,
      get() {
        const realCloseVial = this.getDataValue('close_vial')
        return Math.abs(realCloseVial)
      },
    },
    actual_transaction_date: DataTypes.DATE,
    vaccine_sequence : DataTypes.TINYINT,
    preexposure_method: DataTypes.TINYINT
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    paranoid: true,
    deletedAt: 'deleted_at',
  })

  Transaction.addHook('beforeFind', (options) => {
    if (!options.attributes) {
      options.attributes = [
        'id',
        'material_id',
        'material_name',
        'customer_id',
        'entity_id',
        'entity_name',
        'vendor_id',
        'stock_id',
        'opening_qty',
        'change_qty',
        'closing_qty',
        'transaction_type_id',
        'transaction_reason_id',
        'created_by',
        'updated_by',
        'device_type',
        'createdAt',
        'created_at',
        'updatedAt',
        'deleted_at',
        'order_id',
        'order_type',
        'other_reason',
        'dose_1',
        'dose_2',
        'booster',
        'master_material_id',
        'open_vial',
        'close_vial',
        'activity_id',
        'patient_id',
        'actual_transaction_date',
        'vaccine_sequence',
        'preexposure_method'
      ]
    }
  })

  Transaction.getVirtualAttribute = function () {
    return [
      'created_at',
      'updated_at',
      'closing_qty',
      'change_qty',
      'entity_name',
      'order_type',
    ]
  }

  sequelizePaginate.paginate(Transaction)

  return Transaction
}
