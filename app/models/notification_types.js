'use strict'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class NotificationType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
    }
  }

  NotificationType.init({
    title: DataTypes.STRING,
    type: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'NotificationType',
    tableName: 'notification_types',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  sequelizePaginate.paginate(NotificationType)
  NotificationType.getBasicAttribute = function () {
    return [
      'id',
      'title',
      'type'
    ]
  }
  return NotificationType
}