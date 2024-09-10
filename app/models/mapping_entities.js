'use strict'
const {
  Model
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class MappingEntity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MappingEntity.init({
    id_entitas_smile: DataTypes.INTEGER,
    id_pusdatin: DataTypes.INTEGER,
    id_bpjs: DataTypes.INTEGER,
    id_satu_sehat: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MappingEntity',
    tableName: 'mapping_entities',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  MappingEntity.getBasicAttribute = function () {
    return [
      'id',
      'id_entitas_smile',
      'id_pusdatin',
      'id_bpjs',
      'id_satu_sehat'
    ]
  }
  return MappingEntity
}