import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class TransactionInjection extends Model {

    static associate(models) {
      this.belongsTo(models.Transaction, { as: 'transaction' })
      
      this.addHook('beforeFind', options => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }

        options.include = [
          ...modelInclude,
        ]

        if (options.attributes === undefined) {
          options.attributes = [
            'id',
            'transaction_id',
            'dose_1',
            'dose_2',
            'dose_booster',
            'dose_routine',
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

  TransactionInjection.init({
    transaction_id: DataTypes.BIGINT,
    dose_1: DataTypes.INTEGER,
    dose_2: DataTypes.INTEGER,
    dose_booster: DataTypes.INTEGER,
    dose_routine: DataTypes.INTEGER,
  }, {
    sequelize,
    underscored: true,
    modelName: 'TransactionInjection',
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  })

  sequelizePaginate.paginate(TransactionInjection)

  return TransactionInjection
}
