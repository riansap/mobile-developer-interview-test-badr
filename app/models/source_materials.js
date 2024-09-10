import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class SourceMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    }


  }

  SourceMaterial.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SourceMaterial',
    tableName: 'source_materials',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  })

  return SourceMaterial
}