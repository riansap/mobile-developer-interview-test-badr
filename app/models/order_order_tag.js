import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class OrderOrderTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  OrderOrderTag.init({
    order_id: DataTypes.BIGINT,
    order_tag_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'OrderOrderTag',
    tableName: 'order_order_tag',
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  return OrderOrderTag
}