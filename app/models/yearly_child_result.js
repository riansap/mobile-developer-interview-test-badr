import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class YearlyChildResult extends Model {
    static associate(models) {
      
      this.belongsTo(models.YearlyChild, { as: 'yearly_child', foreignKey: 'yearly_child_id' })
      this.belongsTo(models.Material, { as: 'material', foreignKey: 'material_id' })

      this.belongsTo(models.MasterMaterial, { as: 'master_material', foreignKey: 'master_material_id' })
      this.belongsTo(models.MasterActivity, { as: 'activity', foreignKey: 'activity_id' })

      this.belongsTo(models.User, { as: 'user_created_by', foreignKey: 'created_by' })
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
    }
  }
  YearlyChildResult.init(
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true
      },
      material_id: DataTypes.INTEGER,
      yearly_child_id: DataTypes.BIGINT,
      yearly_need: DataTypes.INTEGER,
      ipv: DataTypes.DECIMAL(10,1),
      created_by: DataTypes.BIGINT,
      updated_by: DataTypes.BIGINT,
      deleted_by: DataTypes.BIGINT,
      version: DataTypes.INTEGER,
      monthly_need: DataTypes.INTEGER,
      weekly_need: DataTypes.INTEGER,
      monthly_distribution: DataTypes.STRING,
      yearly_vial: DataTypes.INTEGER,
      monthly_vial: DataTypes.INTEGER,
      weekly_vial: DataTypes.INTEGER,
      master_material_id: DataTypes.INTEGER,
      activity_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'YearlyChildResult',
      tableName: 'yearly_child_has_results',
      underscored: true,
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )

  sequelizePaginate.paginate(YearlyChildResult)

  return YearlyChildResult
}
