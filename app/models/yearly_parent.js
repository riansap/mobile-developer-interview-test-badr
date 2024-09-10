import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

// Deprecated, unused, change to yearly_plan model

export default (sequelize, DataTypes) => {
  class YearlyParent extends Model {
    static associate(models) {
      this.belongsTo(models.Entity, {
        as: 'province',
        foreignKey: 'province_id',
      })
      this.belongsTo(models.Entity, { as: 'regency', foreignKey: 'regency_id' })
      
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })

      this.belongsToMany(models.MasterTarget, {
        as: 'targets',
        through: models.YearlyParentTarget,
        foreignKey: 'yearly_parent_id',
        otherKey: 'master_target_id',
      })
    }
  }

  YearlyParent.init(
    {
      year: DataTypes.STRING,
      province_id: DataTypes.INTEGER,
      regency_id: DataTypes.INTEGER,

      created_by: DataTypes.BIGINT,
      updated_by: DataTypes.BIGINT,
      deleted_by: DataTypes.BIGINT,
    },
    {
      sequelize,
      modelName: 'YearlyParent',
      tableName: 'yearly_parent',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )

  sequelizePaginate.paginate(YearlyParent)

  return YearlyParent
}
