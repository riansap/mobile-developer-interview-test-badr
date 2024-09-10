'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class BiofarmaOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  BiofarmaOrder.init({
    no_do: DataTypes.STRING,
    tanggal_do: DataTypes.DATE,
    no_po: DataTypes.STRING,
    kode_area: DataTypes.INTEGER,
    pengirim: DataTypes.STRING,
    tujuan: DataTypes.STRING,
    alamat: DataTypes.STRING,
    produk: DataTypes.STRING,
    no_batch: DataTypes.STRING,
    expired_date: DataTypes.DATE,
    jm_vial: DataTypes.INTEGER,
    jm_dosis: DataTypes.INTEGER,
    status: DataTypes.STRING,
    tanggal_terima: DataTypes.DATE,
    exist_smile: DataTypes.INTEGER,
    jm_dosis_terima: DataTypes.INTEGER,
    jm_vial_terima: DataTypes.INTEGER,
    tanggal_kirim: DataTypes.DATE,
    biofarma_type: DataTypes.STRING,
    service_type: DataTypes.INTEGER,
    no_document: DataTypes.STRING,
    released_date: DataTypes.DATE,
    notes: DataTypes.TEXT,
    code_product_kemenkes: DataTypes.STRING,
    entrance_type: DataTypes.STRING,
    grant_country: DataTypes.STRING,
    manufacture_country: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'BiofarmaOrder',
    tableName: 'biofarma_orders',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  })

  BiofarmaOrder.updateOnDuplicate = function () {
    return [
      'tanggal_do',
      'no_po',
      'kode_area',
      'pengirim',
      'tujuan',
      'alamat',
      'produk',
      'expired_date',
      'jm_vial',
      'jm_dosis',
      'status',
      'tanggal_terima',
      'exist_smile',
      'jm_dosis_terima',
      'jm_vial_terima',
      'tanggal_kirim',
      'service_type',
      'no_document',
      'released_date',
      'notes',
      'code_product_kemenkes',
      'entrance_type',
      'grant_country',
      'manufacture_country'
    ]
  }

  return BiofarmaOrder
}