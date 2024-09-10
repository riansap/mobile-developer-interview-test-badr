import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class ExterminationFlow extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.ExterminationFlowReason, {
        as: 'flow_reason',
        foreignKey: 'flow_id'
      })
    }
  }
  ExterminationFlow.init({
    title: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'ExterminationFlow',
    tableName: 'extermination_flows',
  })

  sequelizePaginate.paginate(ExterminationFlow)

  return ExterminationFlow
}