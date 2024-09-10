'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('extermination_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      extermination_transaction_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      material_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      master_material_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      activity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      vendor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stock_extermination_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      opening_qty: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      change_qty: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      open_vial: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      close_vial: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
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
    await queryInterface.dropTable('extermination_transactions')
  }
}