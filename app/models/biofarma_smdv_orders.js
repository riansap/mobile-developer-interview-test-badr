'use strict'
const {
    Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
    class BiofarmaSMDVOrder extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    BiofarmaSMDVOrder.init({
        biofarma_id: DataTypes.BIGINT,
        nomor_do: DataTypes.STRING,
        tanggal_do: DataTypes.DATEONLY,
        nomor_po: DataTypes.STRING,
        kode_area: DataTypes.STRING,
        pengiriman: DataTypes.STRING,
        tujuan_pengiriman: DataTypes.STRING,
        alamat: DataTypes.STRING,
        nama_produk: DataTypes.STRING,
        no_batch: DataTypes.STRING,
        expired_date: DataTypes.DATEONLY,
        jumlah_vial: DataTypes.DOUBLE,
        jumlah_dosis: DataTypes.DOUBLE,
        status: DataTypes.STRING,
        tanggal_terima: DataTypes.DATE,
        jenis_layanan: DataTypes.STRING,
        nomor_surat_alokasi: DataTypes.STRING,
        keterangan: DataTypes.STRING,
        kode_hub: DataTypes.STRING,
        tipe_vaksin: DataTypes.STRING,
        tanggal_pickup: DataTypes.DATE,
        nama_smdv: DataTypes.STRING,
        do_pusat: DataTypes.STRING,
        created_at: DataTypes.DATE,
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        sequelize,
        modelName: 'BiofarmaSMDVOrder',
        tableName: 'biofarma_smdv_orders',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    })

    BiofarmaSMDVOrder.updateOnDuplicate = function () {
        return [
            'nomor_do',
            'tanggal_do',
            'nomor_po',
            'kode_area',
            'pengiriman',
            'tujuan_pengiriman',
            'alamat',
            'nama_produk',
            'no_batch',
            'expired_date',
            'jumlah_vial',
            'jumlah_dosis',
            'status',
            'tanggal_terima',
            'jenis_layanan',
            'nomor_surat_alokasi',
            'keterangan',
            'kode_hub',
            'tipe_vaksin',
            'tanggal_pickup',
            'nama_smdv',
            'do_pusat'
        ]
    }
    return BiofarmaSMDVOrder
}