'use strict'
const {
  Model
} = require('sequelize')
// opname_item_reason_actions
module.exports = (sequelize, DataTypes) => {
  class OpnameItemReasonAction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // opname_item_reason_actions
    }
  }
  OpnameItemReasonAction.init({
    opname_stock_item_id: DataTypes.INTEGER,
    opname_reason_id: DataTypes.INTEGER,
    opname_action_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'OpnameItemReasonAction',
    tableName: 'opname_item_reason_actions',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })
  return OpnameItemReasonAction
}