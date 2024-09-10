import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { as: 'user', foreignKey: 'user_id', otherKey: 'id' })
      this.belongsTo(models.Entity, { as: 'entity', foreignKey: 'entity_id', otherKey: 'id' })
      this.belongsTo(models.Patient, {as: 'patient', foreignKey: 'patient_id', otherKey: 'id'})
    }
  }
  Notification.init({
    user_id: DataTypes.BIGINT,
    message: DataTypes.STRING,
    province_id: DataTypes.INTEGER,
    regency_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    type: DataTypes.STRING,
    media: DataTypes.STRING,
    title: DataTypes.STRING,
    read_at: DataTypes.DATE,
    mobile_phone: DataTypes.STRING,
    action_url: DataTypes.STRING,
    download_url: DataTypes.STRING,
    patient_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    schema: process.env.DB_NOTIFICATION || 'dev_smile_notification'
  })
  return Notification
}
