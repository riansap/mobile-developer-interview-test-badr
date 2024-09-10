import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class ColdstoragePerTemperature extends Model {
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

      this.hasOne(models.RangeTemperature, {
        as: 'range_temperature',
        foreignKey: 'id',
        sourceKey: 'range_temperature_id'
      })

      this.hasOne(models.Coldstorage, {
        as: 'coldstorage',
        foreignKey: 'id',
        sourceKey: 'coldstorage_id'
      })

      this.hasMany(models.ColdstorageMaterial, {
        as: 'coldstorage_materials',
        foreignKey: 'coldstorage_id',
        sourceKey: 'coldstorage_id'
      })
    }
  }
  ColdstoragePerTemperature.init({
    coldstorage_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    range_temperature_id: DataTypes.BIGINT,
    volume_asset: DataTypes.DOUBLE,
    total_volume: DataTypes.DOUBLE,
    percentage_capacity: DataTypes.DOUBLE,
    projection_volume_asset: DataTypes.DOUBLE,
    projection_total_volume: DataTypes.DOUBLE,
    projection_percentage_capacity: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'ColdstoragePerTemperature',
    tableName: 'coldstorage_per_temperature',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(ColdstoragePerTemperature)
  ColdstoragePerTemperature.getBasicAttribute = function () {
    return [
      'id',
      'coldstorage_id',
      'entity_id',
      'range_temperature_id',
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
  return ColdstoragePerTemperature
}