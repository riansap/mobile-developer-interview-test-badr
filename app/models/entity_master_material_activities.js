import { Model, Op } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import models from '.'

export default (sequelize, DataTypes) => {
  class EntityMasterMaterialActivities extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.EntityMasterMaterial, {
        as: 'entity_master_material',
        foreignKey: 'entity_master_material_id'
      })

      this.hasOne(models.User, {
        as: 'user_updated_by',
        foreignKey: 'id',
        sourceKey : 'updated_by'
      })

      this.belongsTo(models.MasterActivity, {
        as : 'activity',
        foreignKey : 'activity_id'
      })
    }
  }

  EntityMasterMaterialActivities.init({
    entity_master_material_id: DataTypes.INTEGER,
    activity_id: DataTypes.INTEGER,
    consumption_rate: DataTypes.DOUBLE,
    retailer_price: DataTypes.DOUBLE,
    tax: DataTypes.DOUBLE,
    min: DataTypes.DOUBLE,
    max: DataTypes.DOUBLE,
    allocated : DataTypes.DOUBLE,
    stock_on_hand : DataTypes.DOUBLE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    available :  {
      type: DataTypes.VIRTUAL,
      get() {
        return this.stock_on_hand - this.allocated
      }
    }
  }, {
    sequelize,
    modelName: 'EntityMasterMaterialActivities',
    tableName: 'entity_master_material_activities',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  EntityMasterMaterialActivities.getBasicAttribute = function () {
    return [
      'id',
      'entity_master_material_id',
      'activity_id',
      'consumption_rate',
      'retailer_price',
      'tax',
      'min',
      'max',
      'allocated',
      'stock_on_hand',
      'available',
      'updated_at'
    ]
  }

  return EntityMasterMaterialActivities
}
