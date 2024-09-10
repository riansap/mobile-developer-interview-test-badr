import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class ColdstorageTransactionLog extends Model {
    /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */

  }
  ColdstorageTransactionLog.init({
    entity_id: DataTypes.INTEGER,
    master_material_id: DataTypes.INTEGER,
    status : DataTypes.TINYINT
  }, {
    sequelize,
    modelName: 'ColdstorageTransactionLog',
    tableName: 'coldstorage_transaction_logs',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })
   
  return ColdstorageTransactionLog
}