const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class EventReportChildReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  EventReportChildReason.init({
    title: DataTypes.STRING,
    parent_id: DataTypes.INTEGER,
    deleted_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'EventReportChildReason',
    tableName: 'event_report_child_reasons',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  })
  return EventReportChildReason
}
