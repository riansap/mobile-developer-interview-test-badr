'use strict'
import sequelizePaginate from 'sequelize-paginate'
import { TRANSACTION_CHANGE_TYPE } from '../helpers/constants'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class ExterminationTransactionType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ExterminationTransactionType.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
        }
      })
    }
  }

  ExterminationTransactionType.init({
    title: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'ExterminationTransactionType',
    tableName: 'extermination_transaction_types',
    paranoid: true
  })

  sequelizePaginate.paginate(ExterminationTransactionType)
  ExterminationTransactionType.getBasicAttribute = function () {
    return [
      'id',
      'title',
    ]
  }
  return ExterminationTransactionType
}