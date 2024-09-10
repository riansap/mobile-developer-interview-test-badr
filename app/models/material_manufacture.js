import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class MaterialManufacture extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MaterialManufacture.init({
    material_id: DataTypes.INTEGER,
    manufacture_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MaterialManufacture',
    underscored: true,
    tableName: 'material_manufacture',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(MaterialManufacture)

  return MaterialManufacture
}