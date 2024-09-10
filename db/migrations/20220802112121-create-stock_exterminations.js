'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stock_exterminations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      stock_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'stocks',
          key: 'id'
        },
      },
      transaction_reason_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'transaction_reasons',
          key: 'id'
        },
      },
      extermination_discard_qty: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      extermination_received_qty: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      extermination_qty: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      },
      extermination_shipped_qty: {
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
    await queryInterface.dropTable('stock_exterminations')
  }
}