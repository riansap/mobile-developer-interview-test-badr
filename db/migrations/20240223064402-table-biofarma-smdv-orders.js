'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction()

    try{
      await queryInterface.createTable('biofarma_smdv_orders', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        biofarma_id : {
          allowNull: false,
          type : Sequelize.BIGINT
        },
        nomor_do: {
          allowNull: true,
          type: Sequelize.STRING
        },
        tanggal_do: {
          allowNull: true,
          type: Sequelize.DATEONLY
        },
        nomor_po: {
          allowNull: true,
          type: Sequelize.STRING
        },
        kode_area: {
          allowNull: true,
          type: Sequelize.STRING
        },
        pengiriman: {
          allowNull: true,
          type: Sequelize.STRING
        },
        tujuan_pengiriman: {
          allowNull: true,
          type: Sequelize.STRING
        },
        alamat: {
          allowNull: true,
          type: Sequelize.STRING
        },
        nama_produk: {
          allowNull: true,
          type: Sequelize.STRING
        },
        no_batch: {
          allowNull: true,
          type: Sequelize.STRING
        },
        expired_date: {
          allowNull: true,
          type: Sequelize.DATEONLY
        },
        jumlah_vial: {
          allowNull: true,
          type: Sequelize.DOUBLE
        },
        jumlah_dosis: {
          allowNull: true,
          type: Sequelize.DOUBLE
        },
        status: {
          allowNull: true,
          type: Sequelize.STRING
        },
        tanggal_terima: {
          allowNull: true,
          type: Sequelize.DATE
        },
        jenis_layanan: {
          allowNull: true,
          type: Sequelize.STRING
        },
        nomor_surat_alokasi: {
          allowNull: true,
          type: Sequelize.STRING
        },
        keterangan: {
          allowNull: true,
          type: Sequelize.STRING
        },
        kode_hub: {
          allowNull: true,
          type: Sequelize.STRING
        },
        tipe_vaksin: {
          allowNull: true,
          type: Sequelize.STRING
        },
        tanggal_pickup: {
          allowNull: true,
          type: Sequelize.DATE
        },
        nama_smdv: {
          allowNull: true,
          type: Sequelize.STRING
        },
        do_pusat: {
          allowNull: true,
          type: Sequelize.STRING
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        deleted_at: {
          allowNull: true,
          type: Sequelize.DATE
        }
      }, {transaction})

      await queryInterface.addIndex('biofarma_smdv_orders', ['biofarma_id'], {
        name: 'biofarma_smdv_orders_index',
        unique: true,
        transaction
      })

      await transaction.commit()
    }catch(err){
      await transaction.rollback()
    }

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    const transaction = await queryInterface.sequelize.transaction()

    try{
      await queryInterface.dropTable('biofarma_smdv_orders', {transaction})

      await transaction.commit()
    }catch(err){
      await transaction.rollback()
    }
  }
};
