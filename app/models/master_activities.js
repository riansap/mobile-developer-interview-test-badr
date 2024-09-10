'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class MasterActivity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.MasterMaterial, {
        as: 'materials',
        through: 'master_material_has_activities',
        foreignKey: 'activity_id',
        otherKey: 'master_material_id',
        timestamps: false
      })

      this.hasOne(models.User, {
        as: 'user_updated_by',
        foreignKey: 'id',
        sourceKey: 'updated_by'
      })

      this.hasOne(models.User, {
        as: 'user_created_by',
        foreignKey: 'id',
        sourceKey: 'created_by'
      })

      this.belongsToMany(models.Entity, {
        as: 'activities_date',
        through: 'entity_activity_date',
        foreignKey: 'activity_id',
        otherKey: 'entity_id',
        timestamps: false,
      })

    }
  }
  MasterActivity.init({
    name: DataTypes.STRING,
    is_ordered_sales: DataTypes.TINYINT,
    is_ordered_purchase: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    is_patient_id: DataTypes.TINYINT
  }, {
    sequelize,
    tableName: 'master_activities',
    modelName: 'MasterActivity',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  MasterActivity.getBasicAttribute = function () {
    return [
      'id',
      'name',
      'is_ordered_sales',
      'is_ordered_purchase',
      'is_patient_id'
    ]
  }

  return MasterActivity
}