import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class Coldstorage extends Model {
    /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
    static associate(models) {
      // define association here
      this.hasOne(models.Entity, {
        as: 'entity',
        foreignKey: 'id',
        sourceKey: 'entity_id'
      })

      this.hasMany(models.ColdstorageMaterial, {
        as: 'coldstorage_materials',
        foreignKey: 'coldstorage_id',
        sourceKey: 'id'
      })

      this.hasMany(models.ColdstoragePerTemperature, {
        as: 'coldstorage_per_temperature',
        foreignKey: 'coldstorage_id',
        sourceKey: 'id'
      })
    }
  }
  Coldstorage.init({
    entity_id: DataTypes.INTEGER,
    volume_asset: DataTypes.DOUBLE,
    total_volume: DataTypes.DOUBLE,
    percentage_capacity: DataTypes.DOUBLE,
    projection_volume_asset: DataTypes.DOUBLE,
    projection_total_volume: DataTypes.DOUBLE,
    projection_percentage_capacity: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'Coldstorage',
    tableName: 'coldstorages',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(Coldstorage)
  Coldstorage.getBasicAttribute = function () {
    return [
      'id',
      'entity_id',
      'volume_asset',
      'total_volume',
      'percentage_capacity',
      'projection_volume_asset',
      'projection_total_volume',
      'projection_percentage_capacity',
      'created_at',
      'updated_at'
    ]
  }
  return Coldstorage
}