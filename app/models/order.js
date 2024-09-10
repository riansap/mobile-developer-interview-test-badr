import { Model, Op } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import { ORDER_STATUS, getLabelByKey, ENTITY_TYPE } from '../helpers/constants'


export default (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.OrderTag, {
        as: 'order_tags',
        through: models.OrderOrderTag
      })

      this.hasMany(models.OrderItemProjectionCapacity, {
        as: 'order_item_projection_capacities',
        foreignKey: 'order_id'
      })

      this.hasMany(models.OrderItem, {
        as: 'order_items',
        foreignKey: 'order_id'
      })

      this.hasMany(models.OrderItemKfa, {
        as : 'order_items_kfa',
        foreignKey : 'order_id'
      })

      this.hasMany(models.OrderComment, {
        as: 'order_comments',
        foreignKey: 'order_id'
      })
      this.hasMany(models.Transaction, {
        as: 'transactions',
        foreignKey: 'order_id'
      })

      this.belongsTo(models.MasterActivity, { as: 'activity', foreignKey: 'activity_id' })
      this.belongsTo(models.Entity, { as: 'customer', foreignKey: 'customer_id' })
      this.belongsTo(models.Entity, { as: 'vendor', foreignKey: 'vendor_id' })
      this.belongsTo(models.TrackDevice, { as: 'track_device', foreignKey: 'track_device_id', timestamps: false})

      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['confirmed_by', 'shipped_by', 'fulfilled_by', 'cancelled_by', 'allocated_by', 'created_by', 'updated_by', 'deleted_by']
      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }

        if (!modelInclude.find(item => item.as === 'order_tags') && !options.without_tags) {
          modelInclude.push({
            model: models.OrderTag,
            as: 'order_tags',
            attributes: ['id', 'title'],
            through: { attributes: [] },

          })
        }

        if(options.order_items_projection) {
          modelInclude.push({
            model: models.OrderItemProjectionCapacity,
            as: 'order_item_projection_capacities',
            attributes: [
              'capacity_asset',
              'total_volume',
              'percent_capacity',
              'is_confirm',
            ],
          })
        }

        if(!options.without_relations) {
          if(!options.without_items) {
            modelInclude.push({
              model: models.OrderItem,
              as: 'order_items',
              attributes: ['id', 'qty', 'material_id', 'recommended_stock'],
              include: [
                {
                  model: models.Material,
                  as: 'material',
                  attributes: models.Material.getBasicAttribute()
                },
                {
                  model: models.MasterMaterial,
                  as: 'master_material',
                  attributes: ['id', 'code', 'name']
                },
                {
                  model: models.OrderStock,
                  as: 'order_stocks',
                  attributes: ['id', 'status', 'order_item_id', 'stock_id', 'allocated_qty', 'received_qty', 'ordered_qty', 'qrcode'],
                  include: [{
                    model: models.Stock,
                    as: 'stock',
                    attributes: ['id', 'batch_id', 'qty'],
                    include: {
                      model: models.Batch,
                      as: 'batch',
                      attributes: ['id', 'manufacture_id', 'code', 'expired_date', 'production_date', 'manufacture_name'],
                      include: {
                        model: models.Manufacture,
                        as: 'manufacture',
                        attributes: ['id', 'name']
                      }
                    }
                  },
                  {
                    model : models.OrderStockPurchase,
                    as : 'order_stock_purchase',
                    attributes : ['id', 'source_material_id', 'year', 'price', 'pieces_purchase_id'],
                    include : [
                      {model : models.SourceMaterial, as : 'source_material'},
                      {model : models.PiecesPurchase, as : 'pieces_purchase'}
                    ]
                  }]
                }
              ]
            })
          }
          let includeCustVendor = []
          if(!options.excludeCustomerVendor) {
            includeCustVendor = [{
              model: models.Entity,
              as: 'customer',
              attributes: models.Entity.getBasicAttribute(),
              include : [
                {
                  model : models.MappingEntity,
                  as : 'mapping_entity',
                  attributes : models.MappingEntity.getBasicAttribute()
                }
              ]
            },
            {
              model: models.Entity,
              as: 'vendor',
              attributes: models.Entity.getBasicAttribute(),
              include : [
                {
                  model : models.MappingEntity,
                  as : 'mapping_entity',
                  attributes : models.MappingEntity.getBasicAttribute()
                }
              ]
            }]
          }
          if(!options.without_comments) {
            modelInclude.push({
              model: models.OrderComment,
              as: 'order_comments',
              attributes: ['id', 'comment', 'created_at', 'order_status'],
              include: {
                model: models.User,
                as: 'user',
                attributes: ['id', 'username', 'email', 'firstname', 'lastname']
              }
            })
          }
          options.include = [
            ...modelInclude,
            ...includeCustVendor,
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

      this.addHook('afterCreate', async (model, options) => {
        await this.createHistory(models, model, options)

        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
      this.addHook('afterUpdate', async (model, options) => {
        await this.createHistory(models, model, options)

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
  Order.init({
    device_type: DataTypes.STRING,
    customer_id: DataTypes.INTEGER,
    delivery_number: DataTypes.STRING,
    vendor_id: DataTypes.INTEGER,
    status: DataTypes.TINYINT,
    type: DataTypes.TINYINT,
    required_date: DataTypes.DATE,
    estimated_date: DataTypes.DATE,
    actual_shipment: DataTypes.DATE,
    purchase_ref: DataTypes.STRING,
    sales_ref: DataTypes.STRING,
    reason: DataTypes.TINYINT,
    confirmed_by: DataTypes.BIGINT,
    shipped_by: DataTypes.BIGINT,
    fulfilled_by: DataTypes.BIGINT,
    cancelled_by: DataTypes.BIGINT,
    confirmed_at: DataTypes.DATE,
    shipped_at: DataTypes.DATE,
    fulfilled_at: DataTypes.DATE,
    cancelled_at: DataTypes.DATE,
    cancel_reason: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    is_allocated: DataTypes.TINYINT,
    taken_by_customer: DataTypes.TINYINT,
    other_reason: DataTypes.STRING,
    allocated_at: DataTypes.DATE,
    allocated_by: DataTypes.BIGINT,
    is_kpcpen: DataTypes.TINYINT,
    qty_kpcpen: DataTypes.INTEGER,
    master_order_id: DataTypes.BIGINT,
    submit_kpcpen_at: DataTypes.DATE,
    easygo_no_do: DataTypes.STRING,
    biofarma_changed: DataTypes.INTEGER,
    service_type: DataTypes.INTEGER,
    no_document: DataTypes.STRING,
    released_date: DataTypes.DATE,
    notes: DataTypes.TEXT,
    activity_id: DataTypes.INTEGER,
    is_manual : DataTypes.TINYINT,
    status_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getLabelByKey(ORDER_STATUS, this.status)
      }
    },
    vendor_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.vendor ? this.vendor.name : ''
      }
    },
    vendor_type: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.vendor ? getLabelByKey(ENTITY_TYPE, this.vendor.type) : ''
      }
    },
    customer_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.customer ? this.customer.name : ''
      }
    },
    order_description: {
      type: DataTypes.VIRTUAL,
      get() {
        if(this.is_kpcpen) return 'DATA DARI KPCPEN'
        else if(this.created_at <= '2021-01-20') return 'FITUR LOG BELUM ADA'
        else return 'MANUAL'
      }
    }
  }, {
    sequelize,
    modelName: 'Order',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  Order.addScope('active', {
    where: {
      [Op.not]: {
        status: [ORDER_STATUS.FULFILLED, ORDER_STATUS.CANCELED]
      }
    }
  })

  sequelizePaginate.paginate(Order)

  Order.createHistory = async (models, model, options) => {
    const history = await models.OrderHistory.create({
      order_id: model.id,
      status: model.status,
      updated_by: model.updated_by
    }, { transaction: options.transaction })
    if (!history) return false
    return true
  }

  Order.getBasicAttribute = function() {
    return [
      'id',
      'device_type',
      'customer_id',
      'vendor_id',
      'status',
      'type',
      'required_date',
      'estimated_date',
      'actual_shipment',
      'purchase_ref',
      'sales_ref',
      'reason',
      'cancel_reason',
      'delivery_number',
      'confirmed_at',
      'shipped_at',
      'fulfilled_at',
      'cancelled_at',
      'allocated_at',
      'created_at',
      'updated_at',
      'is_allocated',
      'taken_by_customer',
      'other_reason',
      'is_kpcpen',
      'qty_kpcpen',
      'master_order_id',
      'easygo_no_do',
      'status_label',
      'biofarma_changed',
      'service_type',
      'no_document',
      'released_date',
      'notes',
      'activity_id',
      'is_manual',
      'created_by'
    ]
  }

  return Order
}
