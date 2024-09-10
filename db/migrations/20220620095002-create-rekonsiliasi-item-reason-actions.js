'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reconciliation_item_reason_actions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reconciliation_item_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'reconciliation_items',
          key: 'id',
        }
      },
      reason_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'opname_reasons',
          key: 'id',
        }
      },
      action_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'opname_actions',
          key: 'id',
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reconciliation_item_reason_actions');
  }
};