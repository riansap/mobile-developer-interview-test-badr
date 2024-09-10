import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class UserChgHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserChgHistory.init({
    user_id: DataTypes.BIGINT,
    old_values: DataTypes.STRING,
    new_values: DataTypes.STRING,
    updated_by: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserChgHistory',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  })
  return UserChgHistory
}