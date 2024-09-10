'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class MasterMaterialCompanion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.MasterMaterial, { as: 'material', foreignKey: 'master_material_id' })
      this.belongsTo(models.MasterMaterial, { as: 'material_companion', foreignKey: 'master_material_companion_id' })
    }
  }
  MasterMaterialCompanion.init({
    master_material_id: DataTypes.INTEGER,
    master_material_companion_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'MasterMaterialCompanion',
    tableName: 'master_material_has_companions',
    underscored: true,
    paranoid: false,
    updatedAt: false,
    createdAt: false,
  })

  MasterMaterialCompanion.getKeyAvailable = function() {
    return [
      'master_material_id',
      'name',
    ]
  }
  return MasterMaterialCompanion
}