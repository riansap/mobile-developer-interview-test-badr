const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class EventReportReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  EventReportReason.init({
    title: DataTypes.STRING,
    deleted_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'EventReportReason',
    tableName: 'event_report_reasons',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  })
  return EventReportReason
}
