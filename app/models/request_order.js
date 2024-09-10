'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class RequestOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.RequestOrderItem, {
        as: 'request_order_items',
        foreignKey: 'request_order_id'
      })
      this.belongsTo(models.Entity, { as: 'customer', foreignKey: 'customer_id' })
      this.belongsTo(models.Entity, { as: 'vendor', foreignKey: 'vendor_id' })

      this.belongsTo(models.User, { as: 'user_created_by', foreignKey: 'created_by' })
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
      this.belongsTo(models.User, { as: 'user_deleted_by', foreignKey: 'deleted_by' })

      this.addHook('beforeFind', (options) => {
        if (options.attributes === undefined) {
          options.attributes = this.getBasicAttribute()
        }

        const userAttributes = [
          'id',
          'username',
          'email',
          'firstname',
          'lastname'
        ]
        const userAlias = ['user_created_by', 'user_updated_by', 'user_deleted_by']

        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }

        if(!options.without_relations) {
          modelInclude.push({
            association: 'request_order_items',
            attributes: models.RequestOrderItem.getBasicAttribute()
          })
        }
        options.include = [
          ...modelInclude,
          ...userAlias.map(alias => ({
            model: models.User,
            as: alias,
            attributes: userAttributes
          }))
        ]
      })
    }
  }
  RequestOrder.init({
    customer_id: DataTypes.INTEGER,
    vendor_id: DataTypes.INTEGER,
    sales_ref: DataTypes.STRING,
    buffer_tag: DataTypes.INTEGER,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'RequestOrder',
    tableName: 'request_orders',
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  RequestOrder.getBasicAttribute = function() {
    return [
      'id',
      'customer_id',
      'vendor_id',
      'sales_ref',
      'buffer_tag',
      'created_at',
      'updated_at',
    ]
  }

  return RequestOrder
}