'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class MasterMaterialCondition extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MasterMaterialCondition.init({
    master_material_id: DataTypes.INTEGER,
    key: DataTypes.STRING,
    value: DataTypes.STRING,
    type: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MasterMaterialCondition',
    tableName: 'master_material_has_conditions',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  MasterMaterialCondition.getKeyAvailable = function() {
    return [
      'roles',
      'entity_types'
    ]
  }
  return MasterMaterialCondition
}