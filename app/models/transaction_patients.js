'use strict'
import sequelizePaginate from 'sequelize-paginate'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class TransactionPatient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Patient, {
        as: 'patient',
        foreignKey : 'patient_id'
      })

      this.belongsTo(models.Transaction, {
        as: 'transaction',
        foreignKey: 'transaction_id'
      })
    }
  }

  TransactionPatient.init({
    transaction_id: DataTypes.BIGINT,
    patient_id: DataTypes.BIGINT,
    vaccine_sequence: DataTypes.TINYINT,
    transaction_type_id: DataTypes.TINYINT,
    transaction_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'TransactionPatient',
    tableName: 'transaction_patients',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  sequelizePaginate.paginate(TransactionPatient)
  TransactionPatient.getBasicAttribute = function () {
    return [
      'id',
      'transaction_id',
      'patient_id',
      'vaccine_sequence',
      'transaction_type_id',
      'transaction_date'
    ]
  }
  return TransactionPatient
}