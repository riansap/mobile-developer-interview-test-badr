import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import { ORDER_STATUS } from '../helpers/constants'

export default (sequelize, DataTypes) => {
  class OrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Material, { as: 'material', foreignKey: 'material_id' })
      this.belongsTo(models.MasterMaterial, { as: 'master_material', foreignKey: 'master_material_id' })
      this.belongsTo(models.Order, { as: 'order', foreignKey: 'order_id' })
      this.belongsTo(models.CovidLog, { as: 'covid_log', foreignKey: 'order_id', otherKey: 'order_id' })
      this.hasMany(models.OrderStock, { as: 'order_stocks', foreignKey: 'order_item_id' })

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
            {
              association: 'material',
              attributes: models.Material.getBasicAttribute(),
              include: [{
                association: 'material_tags',
                attributes: ['title']
              },
              {
                association: 'master_material',
                attributes: ['name', 'unit']
              }
              ]
            },
            {
              association: 'master_material',
              attributes: models.MasterMaterial.getBasicAttribute(),
              include : {
                association: 'mapping_master_material'
              }
            },
            {
              association: 'order_stocks',
              attributes: models.OrderStock.getBasicAttribute(),
              include: [{
                association: 'stock',
                attributes: models.Stock.getBasicAttribute(),
                include: {
                  association: 'batch',
                  attributes: models.Batch.getBasicAttribute(),
                  include: {
                    model: models.Manufacture,
                    as: 'manufacture',
                    attributes: ['id', 'name']
                  }
                }
              },
              {
                association: 'order_stock_exterminations',
                attributes: models.OrderStockExtermination.getBasicAttribute(),
                include: [
                  {
                    association: 'stock_extermination',
                    attributes: models.StockExtermination.getBasicAttributes(),
                    include: [
                      {
                        association: 'transaction_reason',
                        attributes: ['title']
                      }
                    ]
                  }
                ]
              }
              ]

            },
            ...userFields.map(item => ({
              model: models.User,
              as: `user_${item}`,
              attributes: userAttributes
            }))
          ]
        }
        if (options.attributes === undefined) {
          options.attributes = this.getBasicAttribute()
        }
      })

      this.addHook('afterFind', async (model, options) => {
        if(options.with_stocks) {
          const getStock = async (modelFind) => {
            if (modelFind) {
              let order = await models.Order.findByPk(modelFind.order_id)
              const materialEntityAttribute = ['id', 'min', 'max', 'entity_id', 'on_hand_stock', 'available_stock']
              let materialCustomer = await models.MaterialEntity.findOne({
                where: { entity_id: order.customer_id, material_id: modelFind.material_id },
                attributes: materialEntityAttribute,
                without_relations: true,
                with_stocks: true
              }).then(materialEntity => {
                return materialEntity
              })
  
              let materialVendor = await models.MaterialEntity.findOne({
                where: { entity_id: order.vendor_id, material_id: modelFind.material_id },
                attributes: materialEntityAttribute,
                without_relations: true,
                with_stocks: true
              }).then(materialEntity => {
                return materialEntity
              })
              let materialOnConfirmation = 0
              if(order.status === ORDER_STATUS.PENDING) {
                materialOnConfirmation = await models.OrderItem.sum('qty', {
                  include: [{
                    association: 'order',
                    attributes: []
                  }],
                  where: [
                    { material_id: modelFind.material_id },
                    { '$order.vendor_id$': order.vendor_id },
                    { '$order.status$': ORDER_STATUS.CONFIRMED }
                  ],
                  subQuery: false
                }) || 0
              }
              if (materialVendor) {
                materialVendor.setDataValue('confirmation_stock', materialOnConfirmation)
                materialVendor.setDataValue('available_stock', materialVendor.available_stock - materialOnConfirmation)
              }

              modelFind.set('stock_customer', materialCustomer?.dataValues || 0)
              modelFind.set('stock_vendor', materialVendor?.dataValues)
            }
          }
          
          if (Array.isArray(model)) {
            for(let q = 0; q < model.length; q++) {
              await getStock(model[q])
            }
          } else {
            await getStock(model)
          }
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
  OrderItem.init({
    order_id: DataTypes.BIGINT,
    material_id: DataTypes.INTEGER,
    qty: DataTypes.FLOAT,
    recommended_stock: DataTypes.BIGINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    confirmed_qty: DataTypes.FLOAT,
    master_material_id: DataTypes.INTEGER,
    allocated: {
      type: DataTypes.VIRTUAL,
      get() {
        let allocated = 0
        if (this.order_stocks && Array.isArray(this.order_stocks)) {
          this.order_stocks.forEach(element => {
            allocated += element.allocated_qty
          })
        }
        return allocated
      }
    },
    stock_vendor: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('stock_vendor')
      },
      set(value) {
        this.setDataValue('stock_vendor', value)
      }
    },
    stock_customer: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue('stock_customer')
      },
      set(value) {
        this.setDataValue('stock_customer', value)
      }
    },
    shipped: {
      type: DataTypes.VIRTUAL,
      get() {
        if(this.order) {
          let status = this.order.dataValues['status']
          if(status >= ORDER_STATUS.SHIPPED) return this.allocated
        }
        return 0
      }
    },
    not_yet_shipped: {
      type: DataTypes.VIRTUAL,
      get() {
        if(this.order) {
          let status = this.order.dataValues['status']
          if(status === ORDER_STATUS.ALLOCATED) return this.allocated
        }
        return 0
      }
    },
    reason_id: DataTypes.INTEGER,
    other_reason: DataTypes.STRING,
    order_item_kfa_id: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'OrderItem',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(OrderItem)

  OrderItem.getBasicAttribute = function() {
    return [
      'id',
      'order_id',
      'material_id',
      'qty',
      'allocated',
      'stock_customer',
      'stock_vendor',
      'shipped',
      'not_yet_shipped',
      'recommended_stock',
      'created_at',
      'reason_id',
      'other_reason',
      'confirmed_qty',
      'master_material_id',
      'order_item_kfa_id'
    ]
  }

  OrderItem.getItemsOfOrder = function (order_id) {
    const  models = sequelize.models
    return this.findAll({
      where: { order_id },
      without_relations: true,
      include: [
        {
          association: 'master_material',
          attributes: models.MasterMaterial.getBasicAttribute(),
          include: [
            {
              association: 'mapping_master_material',
              attributes: models.MappingMasterMaterial.getBasicAttribute()
            }
          ],
          required: true,
        }, 
        {
          association: 'order_stocks',
          attributes: models.OrderStock.getBasicAttribute(),
          include: [
            {
              association: 'stock',
              attributes: models.Stock.getBasicAttribute(),
              include: [
                {
                  association: 'batch',
                  attributes: models.Batch.getBasicAttribute(),
                  include: {
                    model: models.Manufacture,
                    as: 'manufacture',
                    attributes: ['id', 'name']
                  }
                },
                {
                  association: 'activity',
                  attributes: ['id', 'name'],
                  paranoid: false
                },
                { association: 'source_material' },
              ]
            },
            {
              association: 'order_stock_purchase',
              attributes: models.OrderStockPurchase.getBasicAttributes(),
              include: [
                { association: 'source_material' },
                { association: 'pieces_purchase' }
              ]
            }
          ]
        }
      ]
    })
  }
  return OrderItem
}