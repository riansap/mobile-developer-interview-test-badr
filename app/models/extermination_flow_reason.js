import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class ExterminationFlowReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.ExterminationFlow, {
        as: 'flow',
        foreignKey: 'flow_id'
      })
      this.belongsTo(models.TransactionReason, {
        as: 'transaction_reason',
        foreignKey: 'transaction_reason_id'
      })
      this.addHook('beforeFind', (options) => {
        options.include = [
          {
            association: 'flow',
            attributes: ['id', 'title']
          },
          {
            association: 'transaction_reason',
            attributes: ['id', 'title']
          },
        ]
      })
    }
  }
  ExterminationFlowReason.init({
    flow_id: DataTypes.BIGINT,
    transaction_reason_id: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'ExterminationFlowReason',
    tableName: 'extermination_flow_reasons',
  })

  sequelizePaginate.paginate(ExterminationFlowReason)

  return ExterminationFlowReason
}