'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class EntityEntityTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  EntityEntityTag.init({
    title: DataTypes.STRING,
    entity_id: DataTypes.INTEGER,
    entity_tag_id: DataTypes.INTEGER
  }, {
    sequelize,
    tableName: 'entity_entity_tags',
    modelName: 'EntityEntityTag',
    underscored: true,
    paranoid: true,
    timestamps: false,
  })

  return EntityEntityTag
}