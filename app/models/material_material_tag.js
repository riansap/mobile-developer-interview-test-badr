import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MaterialMaterialTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MaterialMaterialTag.init({
    material_id: DataTypes.INTEGER,
    material_tag_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MaterialMaterialTag',
    tableName: 'material_material_tag',
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })
  return MaterialMaterialTag
}