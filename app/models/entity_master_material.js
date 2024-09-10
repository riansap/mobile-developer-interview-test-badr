import { Model, Op } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import models from '.'

export default (sequelize, DataTypes) => {
  class EntityMasterMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.MasterMaterial, {
        as: 'material',
        foreignKey: 'master_material_id'
      })

      this.hasMany(models.MasterMaterialActivities, {
        as: 'masterMaterialActivities',
        sourceKey : 'master_material_id',
        foreignKey: 'master_material_id'
      })

      this.hasMany(models.EntityMasterMaterialActivities, {
        as: 'entityMasterMaterialActivities',
        foreignKey: 'entity_master_material_id'
      })

      this.hasMany(models.EntityMasterMaterialActivities, {
        as: 'entityMasterMaterialActivitiesFilter',
        foreignKey: 'entity_master_material_id'
      })

      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey: 'entity_id'
      })

      this.hasMany(models.Stock, {
        as: 'stocks',
        foreignKey: 'entity_has_material_id'
      })

      this.hasOne(models.User, {
        as: 'user_updated_by',
        foreignKey: 'id',
        sourceKey : 'updated_by'
      })

      this.addHook('beforeFind', (options) => {
        
      })

      this.addHook('afterFind', async (model, options) => {
        
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

      this.addHook('beforeCreate', async (model) => {
        const duplicateData = await models.EntityMasterMaterial.count({
          where: [
            { master_material_id: model.dataValues['master_material_id'] },
            { entity_id: model.dataValues['entity_id'] }
          ]
        })
        if(duplicateData) throw new Error('You cannot save this material entity, has exists in database') 
      })
    }
  }

  EntityMasterMaterial.init({
    master_material_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    min: DataTypes.DOUBLE,
    max: DataTypes.DOUBLE,
    on_hand_stock: DataTypes.INTEGER,
    available_stock: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('on_hand_stock') - this.getDataValue('allocated_stock')
      }
    },
    material_id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.master_material_id
      }
    },
    allocated_stock: DataTypes.INTEGER,
    stock_last_update: DataTypes.DATE,
    total_open_vial: DataTypes.INTEGER,
    total_close_vial: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('on_hand_stock')
      }
    },
    extermination_discard_qty: DataTypes.DOUBLE,
    extermination_received_qty: DataTypes.DOUBLE,
    extermination_shipped_qty: DataTypes.DOUBLE,
    extermination_qty: DataTypes.DOUBLE,
    extermination_ready_qty: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.extermination_discard_qty + this.extermination_received_qty
      }
    },
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'EntityMasterMaterial',
    tableName: 'entity_has_master_materials',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  EntityMasterMaterial.getBasicAttribute = function () {
    return [
      'id',
      'master_material_id',
      'entity_id',
      'min',
      'max',
      'allocated_stock',
      'on_hand_stock',
      'stock_last_update',
      'total_open_vial',
      'updated_at'
      //'total_close_vial'
    ]
  }

  EntityMasterMaterial.getWastageAttributes = function () {
    return [
      'id',
      'master_material_id',
      'entity_id',
      'stock_last_update',
      'extermination_discard_qty',
      'extermination_received_qty',
      'extermination_shipped_qty',
      'extermination_qty',
      'extermination_ready_qty',
    ]
  }

  return EntityMasterMaterial
}
