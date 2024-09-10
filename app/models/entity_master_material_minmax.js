import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class EntityMasterMaterialMinMax extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.EntityMasterMaterialActivities, {
        as: 'entity_master_material_activities', foreignKey: 'emma_id',
      })

      this.belongsTo(models.YearlyPlan, {
        as: 'yearly_plan', foreignKey: 'yearly_plan_id',
      })
    }
  }

  EntityMasterMaterialMinMax.init({
    emma_id: DataTypes.BIGINT,
    yearly_plan_id: DataTypes.BIGINT,
    min: DataTypes.DOUBLE,
    max: DataTypes.DOUBLE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'EntityMasterMaterialMinMax',
    tableName: 'entity_master_material_minmax',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  EntityMasterMaterialMinMax.getBasicAttribute = function() {
    return [
      'id',
      'emma_id',
      'yearly_plan_id',
      'min',
      'max',
      'created_at',
      'updated_at',
      'deleted_at',
      'created_by',
      'updated_by']
  }

  return EntityMasterMaterialMinMax
}
