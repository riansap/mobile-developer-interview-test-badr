'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class DeleteBiofarma extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DeleteBiofarma.init({
    no_do: {
      type: DataTypes.STRING,
      primaryKey: true
    },
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
    jm_dosis_terima: DataTypes.INTEGER,
    jm_vial_terima: DataTypes.INTEGER,
    tanggal_kirim: DataTypes.DATE,
    jenis_layanan: DataTypes.INTEGER,
    no_surat: DataTypes.STRING,
    tanggal_release: DataTypes.DATE,
    keterangan: DataTypes.TEXT,
    type: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'DeleteBiofarma',
    tableName: 'delete_biofarma',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  })
  
  return DeleteBiofarma
}
