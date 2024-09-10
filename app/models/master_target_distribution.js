import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MasterTargetDistribution extends Model {
    static associate(models) {
      this.belongsTo(models.Material, {
        as: 'material',
        foreignKey: 'material_id',
      })

      this.belongsTo(models.MasterMaterial, {
        as: 'master_material',
        foreignKey: 'master_material_id',
      })

      this.belongsTo(models.MasterActivity, {
        as: 'activity',
        foreignKey: 'activity_id',
      })

      this.belongsTo(models.MasterTarget, {
        as: 'master_target',
        foreignKey: 'master_target_id',
      })
      
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
      this.belongsTo(models.User, { as: 'user_created_by', foreignKey: 'created_by' })
    }
  }

  MasterTargetDistribution.init(
    {
      material_id: DataTypes.INTEGER,
      master_target_id: DataTypes.BIGINT,
      master_material_id : DataTypes.INTEGER,
      activity_id : DataTypes.INTEGER,
      qty: DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER,
      created_by: DataTypes.INTEGER,
      deleted_by: DataTypes.INTEGER,
      material_name: {
        type: DataTypes.VIRTUAL,
        get() {
          let name = ''
          if(this.material) name = this.material.name
          return name
        }
      },
      master_target_name: {
        type: DataTypes.VIRTUAL,
        get() {
          let name = ''
          if(this.master_target) name = this.master_target.name
          return name
        }
      }
    },
    {
      sequelize,
      modelName: 'MasterTargetDistribution',
      tableName: 'master_target_distributions',
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )

  sequelizePaginate.paginate(MasterTargetDistribution)

  return MasterTargetDistribution
}
