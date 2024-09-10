'use strict'
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  
  class MappingMasterMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MappingMasterMaterial.init({
    id_material_smile: DataTypes.INTEGER,
    code_kfa_ingredients: DataTypes.STRING(20),
    code_kfa_product_template: DataTypes.STRING(20),
    code_kfa_product_variant: DataTypes.STRING(20),
    code_kfa_packaging: DataTypes.STRING(20),
    id_kfa: DataTypes.STRING(20),
    code_biofarma: DataTypes.STRING,
    code_bpom: DataTypes.STRING(25),
    name_material_smile : DataTypes.STRING,
    name_kfa_ingredients : DataTypes.STRING,
    name_kfa_product_template : DataTypes.STRING,
    name_kfa_product_variant : DataTypes.STRING,
    name_kfa_packaging : DataTypes.STRING
  }, {
    sequelize,
    modelName: 'MappingMasterMaterial',
    tableName: 'mapping_master_materials',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  MappingMasterMaterial.getBasicAttribute = function () {
    return [
      'id',
      'id_material_smile',
      'code_kfa_ingredients',
      'code_kfa_product_template',
      'code_kfa_product_variant',
      'code_kfa_packaging',
      'id_kfa',
      'code_biofarma',
      'code_bpom',
      'name_material_smile',
      'name_kfa_ingredients',
      'name_kfa_product_template',
      'name_kfa_product_variant',
      'name_kfa_packaging'
    ]
  }
  return MappingMasterMaterial
}