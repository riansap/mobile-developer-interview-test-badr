import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class BpomLog extends Model {
    /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
    static associate(models) {
      // define association here
    }
  }
  BpomLog.init({
    url: DataTypes.STRING,
    payload: DataTypes.TEXT,
    customer_id: DataTypes.INTEGER,
    vendor_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    order_id: DataTypes.BIGINT,
    transaction_id: DataTypes.BIGINT,
    transaction_type_id: DataTypes.INTEGER,
    response: DataTypes.TEXT,
    response_code: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'BpomLog',
    tableName: 'bpom_logs',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    schema: process.env.DB_NOTIFICATION || 'dev_smile_notification'
  })
  return BpomLog
}