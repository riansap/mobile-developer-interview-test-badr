import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MasterTargetRegency extends Model {
    static associate(models) {
      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey: 'entity_id',
      })

      this.belongsTo(models.MasterTarget, {
        as: 'master_target',
        foreignKey: 'master_target_id',
      })
      
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
      this.belongsTo(models.User, { as: 'user_created_by', foreignKey: 'created_by' })
    }
  }

  MasterTargetRegency.init(
    {
      year: DataTypes.STRING,
      master_target_id: DataTypes.BIGINT,
      entity_id: DataTypes.INTEGER,
      qty: DataTypes.INTEGER,
      updated_by: DataTypes.BIGINT,
      created_by: DataTypes.BIGINT
    },
    {
      sequelize,
      modelName: 'MasterTargetRegency',
      tableName: 'master_target_regencies',
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at'
    }
  )

  sequelizePaginate.paginate(MasterTargetRegency)

  return MasterTargetRegency
}
