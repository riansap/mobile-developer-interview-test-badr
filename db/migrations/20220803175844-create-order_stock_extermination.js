'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_stock_exterminations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      order_stock_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'order_stocks',
          key: 'id'
        },
      },
      stock_extermination_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'stock_exterminations',
          key: 'id'
        },
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false
      },
      allocated_discard_qty: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      allocated_received_qty: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      received_qty: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.BIGINT
      },
      updated_by: {
        type: Sequelize.BIGINT
      },
      deleted_by: {
        type: Sequelize.BIGINT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('order_stock_exterminations')
  }
}