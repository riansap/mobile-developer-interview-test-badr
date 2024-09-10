import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class YearlyChild extends Model {
    static associate(models) {
      
      this.belongsTo(models.YearlyPlan, { as: 'yearly_plan', foreignKey: 'yearly_plan_id' })

      this.belongsTo(models.Entity, { as: 'entity', foreignKey: 'entity_id' })

      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
      
      this.belongsToMany(models.MasterTarget, {
        as: 'targets',
        through: models.YearlyChildTarget,
        foreignKey: 'yearly_child_id',
        otherKey: 'master_target_id',
      })

      this.belongsToMany(models.MasterIPV, {
        as: 'ipvs',
        through: models.YearlyChildIPV,
        foreignKey: 'yearly_child_id',
        otherKey: 'master_ipv_id',
      })

      this.hasMany(models.YearlyChildResult, {
        as: 'results',
        foreignKey: 'yearly_child_id',
      })
    }
  }

  YearlyChild.init(
    {
      yearly_plan_id: DataTypes.BIGINT,
      entity_id: DataTypes.INTEGER,

      created_by: DataTypes.BIGINT,
      updated_by: DataTypes.BIGINT,
      deleted_by: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: 'YearlyChild',
      tableName: 'yearly_child',
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )

  sequelizePaginate.paginate(YearlyChild)

  return YearlyChild
}
