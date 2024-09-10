import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class ColdstorageAnnualPlanning extends Model {
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
    }
  }

  ColdstorageAnnualPlanning.init({
    year: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
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
    yearly_child_id: DataTypes.BIGINT,
    yearly_volume_need_percent: DataTypes.DOUBLE,
    yearly_volume_percent: DataTypes.DOUBLE,
    quartal_volume_percent: DataTypes.DOUBLE,
    peak_volume_q3_percent: DataTypes.DOUBLE,
    peak_volume_q4_percent: DataTypes.DOUBLE,
    monthly_volume_percent: DataTypes.DOUBLE,
    peak_volume_augustus_percent: DataTypes.DOUBLE,
    peak_volume_november_percent: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'ColdstorageAnnualPlanning',
    tableName: 'coldstorage_annual_planning',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(ColdstorageAnnualPlanning)
  ColdstorageAnnualPlanning.getBasicAttribute = function () {
    return [
      'id',
      'year',
      'entity_id',
      'yearly_volume_need',
      'yearly_volume',
      'quartal_volume',
      'peak_volume_q3',
      'peak_volume_q4',
      'monthly_volume',
      'peak_volume_augustus',
      'peak_volume_november',
      'created_at',
      'updated_at',
      'yearly_child_id',
      'yearly_volume_need_percent',
      'yearly_volume_percent',
      'quartal_volume_percent',
      'peak_volume_q3_percent',
      'peak_volume_q4_percent',
      'monthly_volume_percent',
      'peak_volume_augustus_percent',
      'peak_volume_november_percent',
    ]
  }
  return ColdstorageAnnualPlanning
}