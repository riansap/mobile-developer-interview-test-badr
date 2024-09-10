'use strict'
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class MappingCancelDiscard extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MappingCancelDiscard.init({
    transaction_discard_id : DataTypes.BIGINT,
    transaction_cancel_discard_id : DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'MappingCancelDiscard',
    tableName: 'mapping_cancel_discard',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  return MappingCancelDiscard
}