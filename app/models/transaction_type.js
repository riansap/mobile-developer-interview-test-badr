'use strict'
import sequelizePaginate from 'sequelize-paginate'
import { TRANSACTION_CHANGE_TYPE } from '../helpers/constants'

const {
  Model, Transaction
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class TransactionType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.TransactionReason, {
        as: 'transaction_reasons',
        foreignKey: 'transaction_type_id',
        attributes: ['id', 'title']
      })
      TransactionType.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
        }
      })
    }
  }

  TransactionType.init({
    title: DataTypes.STRING,
    chg_type: DataTypes.SMALLINT,
    can_restock: {
      type: DataTypes.VIRTUAL,
      get() {
        return TRANSACTION_CHANGE_TYPE.RESTOCK === this.chg_type
      },
      set(value) {
        throw new Error('Do not try to set the `is_replace` value!')
      }
    },
    can_add: {
      type: DataTypes.VIRTUAL,
      get() {
        return TRANSACTION_CHANGE_TYPE.ADD === this.chg_type
      },
      set(value) {
        throw new Error('Do not try to set the `is_add` value!')
      }
    },
    can_remove: {
      type: DataTypes.VIRTUAL,
      get() {
        return TRANSACTION_CHANGE_TYPE.REMOVE === this.chg_type
      },
      set(value) {
        throw new Error('Do not try to set the `is_remove` value!')
      }
    },
  }, {
    sequelize,
    modelName: 'TransactionType',
    tableName: 'transaction_types',
    paranoid: true
  })

  sequelizePaginate.paginate(TransactionType)
  TransactionType.getBasicAttribute = function () {
    return [
      'id',
      'title',
      'chg_type',
      'can_restock',
      'can_remove'
    ]
  }
  return TransactionType
}