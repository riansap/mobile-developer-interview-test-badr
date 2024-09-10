'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stock_intervals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      material_entity_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'material_entity',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      transaction_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'transactions',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      opening_qty: {
        type: Sequelize.DOUBLE,
      },
      change_qty: {
        type: Sequelize.DOUBLE,
      },
      closing_qty: {
        type: Sequelize.DOUBLE,
      },
      current_stock: {
        type: Sequelize.DOUBLE
      },
      min: {
        type: Sequelize.DOUBLE
      },
      max: {
        type: Sequelize.DOUBLE
      },
      status_condition: {
        type: Sequelize.STRING
      },
      date: {
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stock_intervals')
  }
}