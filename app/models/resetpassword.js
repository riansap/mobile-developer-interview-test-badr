'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class ResetPassword extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  ResetPassword.init({
    email: DataTypes.STRING,
    token: DataTypes.STRING,
    expired_at: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ResetPassword',
    tableName: 'reset_passwords'
  })
  return ResetPassword
}