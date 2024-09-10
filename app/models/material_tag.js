import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class MaterialTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.Material, {
        as: 'materials',
        through: 'material_material_tag',
        foreignKey: 'material_tag_id',
        otherKey: 'material_id',
        timestamps: false
      })

      this.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = ['id', 'title', 'is_ordered_sales', 'is_ordered_purchase']
        }
      })

      this.addHook('afterCreate', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
      this.addHook('afterUpdate', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
      this.addHook('afterDestroy', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
        delete model.dataValues['deleted_at']
      })
    }
  }
  MaterialTag.init({
    title: DataTypes.STRING,
    is_ordered_sales: DataTypes.TINYINT,
    is_ordered_purchase: DataTypes.TINYINT
  }, {
    sequelize,
    modelName: 'MaterialTag',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(MaterialTag)

  return MaterialTag
}