const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class NewOpnameItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.NewOpname, {
        as: 'new_opname',
        foreignKey: 'new_opname_id',
      })

      this.belongsTo(models.Material, {
        as: 'material',
        foreignKey: 'material_id',
      })

      this.hasMany(models.NewOpnameStock, {
        as: 'new_opname_stocks',
        foreignKey: 'new_opname_item_id',
      })

      this.belongsTo(models.MasterMaterial, {
        as: 'master_material',
        foreignKey: 'master_material_id',
      })
    }
  }
  NewOpnameItem.init({
    new_opname_id: DataTypes.INTEGER,
    material_id: DataTypes.INTEGER,
    deleted_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'NewOpnameItem',
    tableName: 'new_opname_items',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })
  return NewOpnameItem
}
