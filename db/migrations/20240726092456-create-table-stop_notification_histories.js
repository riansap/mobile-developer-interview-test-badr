'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stop_notification_histories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patient_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        }
      },
      reason_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'stop_notification_reasons',
          key: 'id'
        }
      },
      stop_status: {
        type: Sequelize.TINYINT,
        allowNull: true,
        defaultValue: 1
      },
      created_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updated_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      deleted_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    })

  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('stop_notification_histories')
  }
}