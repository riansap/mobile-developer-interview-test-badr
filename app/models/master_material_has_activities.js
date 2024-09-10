'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class MasterMaterialActivities extends Model {
    /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
    static associate(models) {
      // define association here
      this.belongsTo(models.MasterMaterial, { as: 'material', foreignKey: 'master_material_id' })
      this.belongsTo(models.MasterActivity, { as: 'material_activities', foreignKey: 'activity_id' })
    }
  }
  MasterMaterialActivities.init({
    activity_id: DataTypes.INTEGER,
    master_material_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'MasterMaterialActivities',
    tableName: 'master_material_has_activities',
    underscored: true,
    paranoid: false,
    updatedAt: false,
    createdAt: false,
  })

  MasterMaterialActivities.getKeyAvailable = function () {
    return [
      'activity_id',
      'master_material_id',
    ]
  }
  return MasterMaterialActivities
}