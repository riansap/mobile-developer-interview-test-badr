const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class EventReportHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const userFields = ['updated_by']
      userFields.forEach((item) => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })
    }
  }
  EventReportHistory.init({
    event_report_id: DataTypes.BIGINT,
    status: DataTypes.INTEGER,
    updated_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'EventReportHistory',
    tableName: 'event_report_histories',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  })
  return EventReportHistory
}
