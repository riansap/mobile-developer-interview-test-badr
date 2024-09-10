'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV !== 'development') return false
    await queryInterface.createTable('delete_biofarma', {
      no_do: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING
      },
      tanggal_do: {
        allowNull: true,
        type: Sequelize.DATE
      },
      no_po: {
        allowNull: true,
        type: Sequelize.STRING
      },
      kode_area: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      pengirim: {
        allowNull: true,
        type: Sequelize.STRING
      },
      tujuan: {
        allowNull: true,
        type: Sequelize.STRING
      },
      alamat: {
        allowNull: true,
        type: Sequelize.STRING
      },
      produk: {
        allowNull: true,
        type: Sequelize.STRING
      },
      no_batch: {
        allowNull: true,
        type: Sequelize.STRING
      },
      expired_date: {
        allowNull: true,
        type: Sequelize.DATE
      },
      jm_vial: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      jm_dosis: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      jm_vial_terima: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      jm_dosis_terima: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      status: {
        allowNull: true,
        type: Sequelize.STRING
      },
      tanggal_kirim: {
        allowNull: true,
        type: Sequelize.DATE
      },
      tanggal_terima: {
        allowNull: true,
        type: Sequelize.DATE
      },
      jenis_layanan: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      no_surat: {
        allowNull: true,
        type: Sequelize.STRING
      },
      tanggal_release: {
        allowNull: true,
        type: Sequelize.DATE
      },
      keterangan: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      type: {
        allowNull: true,
        type: Sequelize.STRING
      },
      created_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    })
  },
  down: async (queryInterface, Sequelize) => {
    if (process.env.NODE_ENV !== 'development') return false
    await queryInterface.dropTable('delete_biofarma')
  }
};
