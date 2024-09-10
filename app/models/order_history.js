'use strict'
import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

module.exports = (sequelize, DataTypes) => {
  class OrderHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Order, { as: 'order', foreignKey: 'order_id' })

      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['updated_by']
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
              association: 'order',
              attributes: models.Order.getBasicAttribute()
            },
            ...userFields.map(item => ({
              model: models.User,
              as: `user_${item}`,
              attributes: userAttributes
            }))
          ]
        }
        if (options.attributes === undefined) {
          options.attributes = [
            'id',
            'order_id',
            'updated_by',
            'status',
            'updated_at'
          ]
        }
      })

      this.addHook('afterCreate', (model) => {
        delete model.dataValues['created_at']
      })
      this.addHook('afterUpdate', (model) => {
        delete model.dataValues['created_at']
      })
      this.addHook('afterDestroy', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['deleted_at']
      })
    }
  }
  OrderHistory.init({
    order_id: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    status: DataTypes.TINYINT
  }, {
    sequelize,
    modelName: 'OrderHistory',
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  sequelizePaginate.paginate(OrderHistory)

  return OrderHistory
}