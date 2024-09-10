'use strict'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class RabiesVaccineRule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    }
  }

  RabiesVaccineRule.init({
    sequence: DataTypes.TINYINT,
    active_duration: DataTypes.INTEGER,
    next_duration: DataTypes.INTEGER,
    start_notification: DataTypes.INTEGER,
    end_notification: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'RabiesVaccineRule',
    tableName: 'rabies_vaccine_rules',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  return RabiesVaccineRule
}