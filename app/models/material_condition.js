import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class MaterialCondition extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Material, { as: 'material', foreignKey: 'material_id' })

      this.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
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
      })
    }
  }
  MaterialCondition.init({
    material_id: DataTypes.INTEGER,
    key: DataTypes.STRING,
    value: DataTypes.INTEGER,
    type: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'MaterialCondition',
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  })

  sequelizePaginate.paginate(MaterialCondition)

  MaterialCondition.getBasicAttribute = function () {
    return [
      'id',
      'material_id',
      'key',
      'value'
    ]
  }
  return MaterialCondition
}