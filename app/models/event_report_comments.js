const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class EventReportComment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' })
    }
  }
  EventReportComment.init({
    event_report_id: DataTypes.BIGINT,
    comment: DataTypes.TEXT,
    user_id: DataTypes.BIGINT,
    status: DataTypes.INTEGER,
    deleted_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'EventReportComment',
    tableName: 'event_report_comments',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  })
  return EventReportComment
}
