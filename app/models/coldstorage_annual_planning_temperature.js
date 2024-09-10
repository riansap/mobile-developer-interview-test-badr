import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class ColdstorageAnnualPlanningTemperature extends Model {
    /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
    static associate(models) {
      // define association here
      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey: 'entity_id'
      })

      this.belongsTo(models.RangeTemperature, {
        as: 'range_temperature',
        foreignKey: 'range_temperature_id'
      })

    }
  }

  ColdstorageAnnualPlanningTemperature.init({
    year: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    range_temperature_id: DataTypes.INTEGER,
    yearly_volume_need: DataTypes.DOUBLE,
    yearly_volume: DataTypes.DOUBLE,
    quartal_volume: DataTypes.DOUBLE,
    peak_volume_q3: DataTypes.DOUBLE,
    peak_volume_q4: DataTypes.DOUBLE,
    monthly_volume: DataTypes.DOUBLE,
    peak_volume_augustus: DataTypes.DOUBLE,
    peak_volume_november: DataTypes.DOUBLE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'ColdstorageAnnualPlanningTemperature',
    tableName: 'coldstorage_annual_planning_temperature',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(ColdstorageAnnualPlanningTemperature)
  ColdstorageAnnualPlanningTemperature.getBasicAttribute = function () {
    return [
      'id',
      'year',
      'entity_id',
      'range_temperature_id',
      'yearly_volume_need',
      'yearly_volume',
      'quartal_volume',
      'peak_volume_q3',
      'peak_volume_q4',
      'monthly_volume',
      'peak_volume_augustus',
      'peak_volume_november',
      'created_at',
      'updated_at'
    ]
  }
  return ColdstorageAnnualPlanningTemperature
}