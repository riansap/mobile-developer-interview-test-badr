import { Model, Op } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import models from '../models'

export default (sequelize, DataTypes) => {
  class MaterialEntity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Material, {
        as: 'material',
        foreignKey: 'material_id'
      })

      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey: 'entity_id'
      })

      this.hasMany(models.Stock, {
        as: 'stocks',
        foreignKey: 'material_entity_id'
      })
      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['created_by', 'updated_by', 'deleted_by']
      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }

        if(!options.without_relations) {
          options.include = [
            ...modelInclude,
            ...userFields.map(item => ({
              model: models.User,
              as: `user_${item}`,
              attributes: userAttributes
            }))
          ]
        }

        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
        }

        if(options.with_stocks) {
          options.attributes = [
            ...options.attributes,
            [sequelize.literal('(SELECT SUM(qty) FROM stocks WHERE material_entity_id = `MaterialEntity`.`id`)'), 'on_hand_stock'],
            [sequelize.literal('(SELECT SUM(allocated) FROM stocks WHERE material_entity_id = `MaterialEntity`.`id`)'), 'allocated_stock'],
            [sequelize.literal('(SELECT MAX(updatedAt) FROM stocks WHERE material_entity_id = `MaterialEntity`.`id`)'), 'stock_update'],
            [sequelize.literal('(SELECT (SUM(qty) - SUM(allocated)) FROM stocks WHERE material_entity_id = `MaterialEntity`.`id`)'), 'available_stock']
          ]
        }
      })

      this.addHook('afterFind', async (model, options) => {
        // if(options.with_stocks) {
        // if (Array.isArray(model)) {
        //   if(model.length > 0) await model[0].getStockArray(model)
        //   // for(let q = 0; q < model.length; q++) {
        //   //   await model[q].getStock()
        //   // }
        // } else {
        //   if(model) {
        //     await model.getStock()
        //   }
        // }
        // }
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
        const duplicateData = await models.MaterialEntity.count({
          where: [
            { material_id: model.dataValues['material_id'] },
            { entity_id: model.dataValues['entity_id'] }
          ]
        })
        if(duplicateData) throw new Error('You cannot save this material entity, has exists in database') 
      })
    }
  }

  MaterialEntity.init({
    material_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    retailer_price: DataTypes.DOUBLE,
    tax: DataTypes.DOUBLE,
    min: DataTypes.DOUBLE,
    max: DataTypes.DOUBLE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    abnormality_type: DataTypes.STRING,
    abnormality_duration_days: DataTypes.DOUBLE,
    inventory_policy: DataTypes.DOUBLE,
    service_level: DataTypes.DOUBLE,
    days_stock: DataTypes.DOUBLE,
    consumption_rate: DataTypes.DOUBLE,
    consumption_rate_week: DataTypes.DOUBLE,
    consumption_rate_month: DataTypes.DOUBLE,
    demand_forecast: DataTypes.DOUBLE,
    safety_stock: DataTypes.DOUBLE,
    optimal_order_quantity: DataTypes.DOUBLE,
    lead_time_demand: DataTypes.DOUBLE,
    lead_time_days: DataTypes.DOUBLE,
    order_periodicity_days: DataTypes.DOUBLE,
    min_updated_at: DataTypes.DATE,
    max_updated_at: DataTypes.DATE,
    retailer_price_updated_at: DataTypes.DATE,
    on_hand_stock: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('on_hand_stock')
      },
      set(value) {
        this.setDataValue('on_hand_stock', value)
      }
    },
    available_stock: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('on_hand_stock') - this.getDataValue('allocated_stock')
      }
    },
    allocated_stock: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('allocated_stock')
      },
      set(value) {
        this.setDataValue('allocated_stock', value)
      }
    },
    transit_stock: {
      type: DataTypes.VIRTUAL,
      get() {
        return 0
      },
      set(value) {
        throw new Error('Do not try to set the `transit_stock` value!')
      }
    },
    stock_update: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('stock_update')
      },
      set(value) {
        this.setDataValue('stock_update', value)
      }
    }
  }, {
    sequelize,
    modelName: 'MaterialEntity',
    tableName: 'material_entity',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  MaterialEntity.getBasicAttribute = function () {
    return [
      'id',
      'material_id',
      'entity_id',
      'consumption_rate',
      'retailer_price',
      'tax',
      'min',
      'max',
      // 'allocated_stock',
      // 'available_stock',
      // 'on_hand_stock',
      // 'stock_update'
    ]
  }

  MaterialEntity.prototype.getStock = async function() {
    const id = this.getDataValue('id')
    let sumStock = 0
    let allocateStock = 0
    let stockUpdate = ''
    if (id) {
      const stock = await models.Stock.findOne({
        where: { material_entity_id: id },
        group: ['material_entity_id'],
        attributes: [
          [sequelize.fn('sum', sequelize.col('qty')), 'on_hand_stock'],
          [sequelize.fn('max', sequelize.col('updatedAt')), 'stock_update'],
          [sequelize.fn('sum', sequelize.col('allocated')), 'allocated_stock']
        ]
      })
      if (stock) {
        sumStock = stock.toJSON().on_hand_stock
        stockUpdate = stock.toJSON().stock_update
        allocateStock = stock.toJSON().allocated_stock
      }
    }
    this.setDataValue('on_hand_stock', sumStock)
    this.setDataValue('allocated_stock', allocateStock)
    this.setDataValue('stock_update', stockUpdate)
  }

  MaterialEntity.prototype.getStockArray = async function(model = []) {
    const Ids = model.map(item => item.id )
    const stocks = await models.Stock.findAll({
      where: { 
        material_entity_id: {
          [Op.in]: Ids 
        }
      },
      group: ['material_entity_id'],
      attributes: [
        'material_entity_id',
        [sequelize.fn('sum', sequelize.col('qty')), 'on_hand_stock'],
        [sequelize.fn('max', sequelize.col('updatedAt')), 'stock_update'],
        [sequelize.fn('sum', sequelize.col('allocated')), 'allocated_stock']
      ]
    })
    for(let i = 0; i < model.length; i++) {
      let entityStock = stocks.find(el => el.material_entity_id === model[i].id)
      if(entityStock) {
        entityStock = entityStock.toJSON() 
        model[i].setDataValue('on_hand_stock', entityStock.on_hand_stock)
        model[i].setDataValue('allocated_stock', entityStock.allocated_stock)
        model[i].setDataValue('stock_update', entityStock.stock_update)
      }
    }
  }

  sequelizePaginate.paginate(MaterialEntity)

  return MaterialEntity
}
