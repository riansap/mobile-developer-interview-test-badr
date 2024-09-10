import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class YearlyParentTarget extends Model {}
  YearlyParentTarget.init(
    {
      master_target_id: DataTypes.INTEGER,
      yearly_plan_id: DataTypes.BIGINT,

      propotion: DataTypes.DECIMAL(10,1),
      qty: DataTypes.INTEGER,
      custom_qty: DataTypes.INTEGER,
      status: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'YearlyParentTarget',
      tableName: 'yearly_parent_has_target',
      underscored: true,
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )
  return YearlyParentTarget
}
