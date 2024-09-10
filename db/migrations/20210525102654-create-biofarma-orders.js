'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('biofarma_orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      biofarma_id: {
        type: Sequelize.INTEGER
      },
      no_do: {
        type: Sequelize.STRING
      },
      tanggal_do: {
        type: Sequelize.DATE
      },
      no_po: {
        type: Sequelize.STRING
      },
      kode_area: {
        type: Sequelize.INTEGER
      },
      pengirim: {
        type: Sequelize.STRING
      },
      tujuan: {
        type: Sequelize.STRING
      },
      alamat: {
        type: Sequelize.STRING
      },
      produk: {
        type: Sequelize.STRING
      },
      no_batch: {
        type: Sequelize.STRING
      },
      expired_date: {
        type: Sequelize.DATE
      },
      jm_vial: {
        type: Sequelize.INTEGER
      },
      jm_dosis: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      tanggal_terima: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      exist_smile: {
        type: Sequelize.INTEGER
      }
    })
    await queryInterface.addIndex('biofarma_orders', ['no_do'])
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('biofarma_orders')
    await queryInterface.removeIndex('biofarma_orders', 'biofarma_orders_no_do')
  }
}