import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class YearlyChildTarget extends Model {
    static associate(models) {
      this.belongsTo(models.YearlyChild, { as: 'yearly_child', foreignKey: 'yearly_child_id' })
      this.belongsTo(models.MasterTarget, { as: 'master_target', foreignKey: 'master_target_id' })
    }
  }
  YearlyChildTarget.init(
    {
      master_target_id: DataTypes.INTEGER,
      yearly_child_id: DataTypes.INTEGER,

      propotion: DataTypes.DECIMAL(10,1),
      qty: DataTypes.INTEGER,
      custom_qty: DataTypes.INTEGER,
      status: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'YearlyChildTarget',
      tableName: 'yearly_child_has_target',
      underscored: true,
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )
  return YearlyChildTarget
}
