import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MaterialCompanion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Material, { as: 'material', foreignKey: 'material_id' })
      this.belongsTo(models.Material, { as: 'material_companion', foreignKey: 'material_companion_id' })
    }
  }
  MaterialCompanion.init({
    material_id: DataTypes.INTEGER,
    material_companion_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'MaterialCompanion',
    underscored: true,
    paranoid: false,
    updatedAt: false,
    createdAt: false,
  })

  MaterialCompanion.getBasicAttribute = function () {
    return [
      'material_id',
      'name',
    ]
  }
  return MaterialCompanion
}
