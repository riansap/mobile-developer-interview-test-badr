import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class YearlyPlanIPV extends Model {
    static associate(models) {
      
      this.belongsTo(models.YearlyChild, { as: 'yearly_plan', foreignKey: 'yearly_plan_id' })
      this.belongsTo(models.MasterIPV, { as: 'master_ipv', foreignKey: 'master_ipv_id' })

      this.belongsTo(models.User, { as: 'user_created_by', foreignKey: 'created_by' })
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
    }
  }
  YearlyPlanIPV.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true
      },
      master_ipv_id: DataTypes.INTEGER,
      yearly_plan_id: DataTypes.INTEGER,
      status: DataTypes.STRING,
      custom_ipv: DataTypes.DECIMAL(10,1),
      created_by: DataTypes.BIGINT,
      updated_by: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: 'YearlyPlanIPV',
      tableName: 'yearly_plan_has_ipvs',
      underscored: true,
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )

  sequelizePaginate.paginate(YearlyPlanIPV)

  return YearlyPlanIPV
}
