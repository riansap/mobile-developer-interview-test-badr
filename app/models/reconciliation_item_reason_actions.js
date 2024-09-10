'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class ReconciliationItemReasonAction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.OpnameReason, {
        as: 'reason',
        foreignKey: 'reason_id',
      })

      this.belongsTo(models.OpnameAction, {
        as: 'action',
        foreignKey: 'action_id',
      })
    }
  }
  ReconciliationItemReasonAction.init({
    reconciliation_item_id: DataTypes.INTEGER,
    reason_id: DataTypes.INTEGER,
    action_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ReconciliationItemReasonAction',
    tableName: 'reconciliation_item_reason_actions',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })
  return ReconciliationItemReasonAction
}