'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class DinOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.DinOrderItem, {
        as: 'din_order_items',
        foreignKey: 'din_order_id'
      })

    }
  }

  DinOrder.init({
    no_do: DataTypes.STRING,
    tanggal_do: DataTypes.DATE,
    no_po: DataTypes.STRING,
    kode_area: DataTypes.INTEGER,
    pengirim: DataTypes.STRING,
    nama_pengirim: DataTypes.STRING,
    tujuan: DataTypes.STRING,
    type_penerima: DataTypes.STRING,
    alamat: DataTypes.STRING,
    status: DataTypes.STRING,
    tanggal_terima: DataTypes.DATE,
    exist_smile: DataTypes.INTEGER,
    tanggal_kirim: DataTypes.DATE,
    din_type: DataTypes.STRING,
    service_type: DataTypes.INTEGER,
    no_document: DataTypes.STRING,
  
    notes: DataTypes.TEXT,
    kode_pengirim: DataTypes.STRING,
    kode_penerima : DataTypes.STRING,

    line : DataTypes.STRING,
    sumber_dana : DataTypes.STRING,

    biaya_transport : DataTypes.INTEGER,
    total_transaksi : DataTypes.INTEGER,
    jenis_layanan : DataTypes.STRING,
    alamat_pengirim : DataTypes.STRING,
    kodepos_pengirim : DataTypes.STRING,
    provinsi_pengirim : DataTypes.STRING,
    provinsi_id_pengirim : DataTypes.INTEGER,
    kabkota_pengirim : DataTypes.STRING,
    kabkota_id_pengirim : DataTypes.INTEGER,
    kecamatan_pengirim : DataTypes.STRING,
    kecamatan_id_pengirim : DataTypes.INTEGER,
    kelurahan_pengirim: DataTypes.STRING,
    kelurahan_id_pengirim: DataTypes.BIGINT,

    alamat_penerima : DataTypes.STRING,
    kodepos_penerima : DataTypes.STRING,
    provinsi_penerima : DataTypes.STRING,
    provinsi_id_penerima : DataTypes.INTEGER,
    kabkota_penerima : DataTypes.STRING,
    kabkota_id_penerima : DataTypes.INTEGER,
    kecamatan_penerima : DataTypes.STRING,
    kecamatan_id_penerima : DataTypes.INTEGER,
    kelurahan_penerima: DataTypes.STRING,
    kelurahan_id_penerima: DataTypes.BIGINT,
    key_ssl : DataTypes.STRING,
    line_ref : DataTypes.STRING,
    carrier_ref : DataTypes.STRING,
    carrier: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DinOrder',
    tableName: 'din_orders',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  })
  
  return DinOrder
}