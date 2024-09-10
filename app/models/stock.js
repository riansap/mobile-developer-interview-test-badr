'use strict'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Stock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.SourceMaterial, {
        as: 'source_material',
        foreignKey: 'budget_source'
      })
      this.belongsTo(models.Batch, {
        as: 'batch',
        foreignKey: 'batch_id'
      })

      this.hasMany(models.Transaction, {
        as: 'transactions',
        foreignKey: 'stock_id'
      })

      this.hasMany(models.StockExtermination, {
        as: 'stock_exterminations',
        foreignKey: 'stock_id'
      })

      this.belongsTo(models.MaterialEntity, {
        as: 'material_entity',
        foreignKey: 'material_entity_id'
      })

      this.belongsTo(models.MasterActivity, {
        as: 'activity',
        foreignKey: 'activity_id'
      })

      this.belongsTo(models.EntityMasterMaterial, {
        as: 'entity_master_material',
        foreignKey: 'entity_has_material_id'
      })

      this.addHook('afterCreate', (model) => {
        console.log('stock after create')
      })

      this.addHook('afterUpdate', async (model, options) => {
        console.log('stock after update')
        await this.updateTotalPrice(models, model, options)
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
    }
  }

  Stock.init({
    year: DataTypes.INTEGER,
    price: DataTypes.DOUBLE,
    total_price: DataTypes.DOUBLE,
    budget_source: DataTypes.BIGINT,
    material_entity_id: DataTypes.BIGINT,
    batch_id: DataTypes.BIGINT,
    status: DataTypes.SMALLINT,
    qty: DataTypes.DOUBLE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    allocated: DataTypes.DOUBLE,
    in_transit: DataTypes.DOUBLE,
    available: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.qty - this.allocated
      }
    },
    stock_id: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.id
      }
    },
    open_vial: DataTypes.INTEGER,
    close_vial: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.qty
      }
    },
    activity_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.activity ? this.activity.name : ''
      }
    },
    extermination_discard_qty: DataTypes.DOUBLE,
    extermination_received_qty: DataTypes.DOUBLE,
    extermination_qty: DataTypes.DOUBLE,
    extermination_shipped_qty: DataTypes.DOUBLE,
    extermination_ready_qty: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.extermination_discard_qty + this.extermination_received_qty
      }
    },
  }, {
    sequelize,
    modelName: 'Stock',
    tableName: 'stocks'
  })

  sequelizePaginate.paginate(Stock)

  Stock.updateTotalPrice = async (models, model, options) => {
    if (model.price && model.changed('qty')) {
      const stockUpdate = await models.Stock.update({
        total_price: model.qty * model.price
      }, { where : {id : model.id}, transaction: options.transaction })
      if(!stockUpdate) return false
    }

    return true
  }

  Stock.getBasicAttribute = function () {
    return [
      'id',
      'material_entity_id',
      'batch_id',
      'status',
      'qty',
      'created_by',
      'updated_by',
      'updatedAt',
      'createdAt',
      'available',
      'allocated',
      'stock_id',
      'open_vial',
      'activity_id',
      'year',
      'price',
      'total_price',
      'budget_source'
    ]
  }

  Stock.getBasicAttributeV2 = function () {
    return [
      'id',
      'entity_has_material_id',
      'batch_id',
      'status',
      'qty',
      'created_by',
      'updated_by',
      'updatedAt',
      'createdAt',
      'available',
      'allocated',
      'stock_id',
      'activity_id',
      'open_vial',
      'close_vial',
      'year',
      'price',
      'total_price',
      'budget_source'
    ]
  }

  Stock.getWastageAttributes = () => [
    'id',
    'entity_has_material_id',
    'stock_id',
    'batch_id',
    'status',
    'activity_id',
    'extermination_discard_qty',
    'extermination_received_qty',
    'extermination_qty',
    'extermination_shipped_qty',
    'extermination_ready_qty',
  ]

  // Stock.prototype.getAllocated = async function() {
  //   const id = this.getDataValue('id')
  //   let allocatedStock = 0
  //   if (this) {
  //     const allocated = await models.OrderStock.scope('allocated').sum('allocated_qty', {
  //       where: { stock_id: id },
  //     }).then(sum => {
  //       return sum
  //     })
  //     if (allocated) allocatedStock = allocated
  //   }
  //   this.setDataValue('allocated', allocatedStock)
  // }

  return Stock
}
