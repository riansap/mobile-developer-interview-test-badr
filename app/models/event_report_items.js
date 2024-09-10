const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class EventReportItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.MasterMaterial, {
        as: 'material',
        foreignKey: 'material_id',
      })

      this.belongsTo(models.EventReportReason, {
        as: 'reason',
        foreignKey: 'reason_id',
      })

      this.belongsTo(models.EventReportChildReason, {
        as: 'child_reason',
        foreignKey: 'child_reason_id',
      })
    }
  }
  EventReportItem.init({
    event_report_id: DataTypes.BIGINT,
    material_id: DataTypes.INTEGER,
    no_batch: DataTypes.INTEGER,
    expired_date: DataTypes.DATE,
    production_date: DataTypes.DATE,
    qty: DataTypes.INTEGER,
    reason_id: DataTypes.INTEGER,
    child_reason_id: DataTypes.INTEGER,
    custom_material: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'EventReportItem',
    tableName: 'event_report_items',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  })
  return EventReportItem
}
