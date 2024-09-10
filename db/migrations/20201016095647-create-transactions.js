'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      material_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      customer_id: {
        type: Sequelize.INTEGER
      },
      vendor_id: {
        type: Sequelize.INTEGER
      },
      opening_qty: {
        allowNull: false,
        type: Sequelize.DOUBLE
      },
      change_qty: {
        allowNull: false,
        type: Sequelize.DOUBLE
      },
      transaction_type_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      transaction_reason_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      created_by: {
        type: Sequelize.BIGINT
      },
      updated_by: {
        type: Sequelize.BIGINT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions')
  }
}