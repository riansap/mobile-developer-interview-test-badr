import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MasterMaterialType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasOne(models.User, {
        as: 'user_updated_by',
        foreignKey: 'id',
        sourceKey: 'updated_by'
      })

      this.hasOne(models.User, {
        as: 'user_created_by',
        foreignKey: 'id',
        sourceKey: 'created_by'
      })
    }


  }

  MasterMaterialType.init({
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER,
    activity_id : DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MasterMaterialType',
    tableName: 'master_material_type',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  })

  return MasterMaterialType
}