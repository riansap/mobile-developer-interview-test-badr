import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class TransactionItem extends Model {

    static associate(models) {
      this.belongsTo(models.Transaction, { as: 'transaction' })
      this.belongsTo(models.Stock, { as: 'stock' })
      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['created_by', 'updated_by']
      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      this.addHook('beforeFind', options => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }

        options.include = [
          ...modelInclude,
          ...userFields.map(item => ({
            model: models.User,
            as: `user_${item}`,
            attributes: userAttributes
          }))
        ]

        if (options.attributes === undefined) {
          options.attributes = [
            'id',
            'transaction_id',
            'stock_id'
          ]
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

  TransactionItem.init({
    transaction_id: DataTypes.BIGINT,
    stock_id: DataTypes.BIGINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT
  }, {
    sequelize,
    underscored: true,
    modelName: 'TransactionItem',
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  })

  sequelizePaginate.paginate(TransactionItem)

  return TransactionItem
}
