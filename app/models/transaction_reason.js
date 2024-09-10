'use strict'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class TransactionReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.TransactionType, { as: 'transaction_type', foreignKey: 'transaction_type_id' })

      TransactionReason.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = [
            'id',
            'title',
            'transaction_type_id',
            'is_other',
            'is_purchase'
          ]
        }
        if(!options.include) {
          options.include = {
            association: 'transaction_type',
          }
        }
      })
    }
  }
  TransactionReason.init({
    title: DataTypes.STRING,
    transaction_type_id: DataTypes.INTEGER,
    is_other: DataTypes.TINYINT,
    is_purchase : DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TransactionReason',
    paranoid: true,
    tableName: 'transaction_reasons'
  })

  sequelizePaginate.paginate(TransactionReason)

  return TransactionReason
}