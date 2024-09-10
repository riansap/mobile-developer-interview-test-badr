import sequelizePaginate from 'sequelize-paginate'
import { mainSchema } from '../../config/schema'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class EntityTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // this.belongsToMany(models.Entity, {
      //   as: 'entities',
      //   through: 'entity_entity_tags',
      //   foreignKey: 'entity_id',
      //   otherKey: 'entity_tag_id',
      //   timestamps: false
      // })
    }
  }
  EntityTag.init({
    title: DataTypes.STRING,
  }, {
    sequelize,
    tableName: 'entity_tags',
    modelName: 'EntityTag',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    schema: mainSchema
  })
  sequelizePaginate.paginate(EntityTag)
  return EntityTag
}