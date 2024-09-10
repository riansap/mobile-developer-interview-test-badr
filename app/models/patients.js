'use strict'
import sequelizePaginate from 'sequelize-paginate'
import { mainSchema } from '../../config/schema'
import { doDecrypt } from '../helpers/common'

const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey : 'entity_id'
      })
    }
  }

  Patient.init({
    nik: DataTypes.STRING,
    vaccine_sequence: DataTypes.TINYINT,
    last_vaccine_at : DataTypes.DATE,
    entity_id : DataTypes.INTEGER,
    identity_type : DataTypes.TINYINT,
    preexposure_sequence: DataTypes.TINYINT,
    last_preexposure_at: DataTypes.DATE,
    stop_notification: DataTypes.TINYINT,
    nik_visible: {
      type: DataTypes.VIRTUAL,
      get(){
        return this.nik ? doDecrypt(this.nik) : ''
      }
    }
  }, {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    schema: mainSchema,
  })

  sequelizePaginate.paginate(Patient)
  Patient.getBasicAttribute = function () {
    return [
      'id',
      'nik',
      'vaccine_sequence',
      'last_vaccine_at',
      'entity_id',
      'identity_type',
      'preexposure_sequence',
      'last_preexposure_at',
      'stop_notification'
    ]
  }
  return Patient
}