import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class UserUserTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserUserTag.init({
    user_id: DataTypes.BIGINT,
    user_tag_id: DataTypes.BIGINT
  }, {
    sequelize,
    underscored: true,
    paranoid: true,
    modelName: 'UserUserTag',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })


  return UserUserTag
}