import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class YearlyPlan extends Model {
    static associate(models) {
      this.belongsTo(models.Entity, { as: 'regency', foreignKey: 'entity_regency_id' })

      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })

      this.belongsToMany(models.MasterIPV, {
        as: 'ipvs',
        through: models.YearlyPlanIPV,
        foreignKey: 'yearly_plan_id',
        otherKey: 'master_ipv_id',
      })

      this.belongsToMany(models.MasterTarget, {
        as: 'targets',
        through: models.YearlyParentTarget,
        foreignKey: 'yearly_plan_id',
        otherKey: 'master_target_id',
      })

      this.hasOne(models.EntityMasterMaterialMinMax, {
        as : 'entity_master_material_minmax',
        foreignKey : 'yearly_plan_id'
      })
    }
  }

  YearlyPlan.init(
    {
      year: DataTypes.STRING,
      entity_regency_id: DataTypes.INTEGER,
      step: DataTypes.INTEGER,
      status: DataTypes.STRING,
      created_by: DataTypes.BIGINT,
      updated_by: DataTypes.BIGINT,
      deleted_by: DataTypes.BIGINT,
      submitted_by: DataTypes.BIGINT,
      submitted_at: DataTypes.DATE,
      comment: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'YearlyPlan',
      tableName: 'yearly_plans',
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )

  sequelizePaginate.paginate(YearlyPlan)

  return YearlyPlan
}
