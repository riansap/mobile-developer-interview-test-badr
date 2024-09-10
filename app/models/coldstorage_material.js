import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class ColdstorageMaterial extends Model {
    /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
    static associate(models) {
      // define association here
      this.hasOne(models.MasterMaterial, {
        as: 'master_material',
        foreignKey: 'id',
        sourceKey : 'master_material_id'
      })
    }
  }
  ColdstorageMaterial.init({
    coldstorage_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    master_material_id: DataTypes.INTEGER,
    dosage_stock: DataTypes.DOUBLE,
    vial_stock: DataTypes.DOUBLE,
    package_stock: DataTypes.DOUBLE,
    package_volume: DataTypes.DOUBLE,
    remain_package_fulfill: DataTypes.DOUBLE,
    volume_per_liter : DataTypes.DOUBLE,
    max_dosage : DataTypes.DOUBLE,
    recommend_order_base_on_max : DataTypes.DOUBLE,
    projection_stock : DataTypes.DOUBLE,
    projection_vial_stock : DataTypes.DOUBLE,
    projection_package_stock : DataTypes.DOUBLE,
    projection_package_volume : DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'ColdstorageMaterial',
    tableName: 'coldstorage_materials',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })


  sequelizePaginate.paginate(ColdstorageMaterial)
  ColdstorageMaterial.getBasicAttribute = function () {
    return [
      'id',
      'coldstorage_id',
      'entity_id',
      'master_material_id',
      'dosage_stock',
      'vial_stock',
      'package_stock',
      'package_volume',
      'remain_package_fulfill',
      'volume_per_liter',
      'created_at',
      'updated_at',
      'max_dosage',
      'recommend_order_base_on_max',
      'projection_stock',
    ]
  }
  return ColdstorageMaterial
}