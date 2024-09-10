import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class RangeTemperature extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RangeTemperature.init({
    temperature_min: DataTypes.DOUBLE,
    temperature_max: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'RangeTemperature',
    tableName: 'range_temperature',
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(RangeTemperature)

  RangeTemperature.getBasicAttribute = function () {
    return [
      'temperature_min',
      'temperature_max',
    ]
  }

  return RangeTemperature
}