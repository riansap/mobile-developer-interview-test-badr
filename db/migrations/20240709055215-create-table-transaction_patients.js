'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transaction_patients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      transaction_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'transactions',
          key: 'id'
        }
      },
      patient_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'patients',
          key: 'id'
        }
      },
      vaccine_sequence: {
        type: Sequelize.TINYINT
      },
      transaction_type_id: {
        type: Sequelize.TINYINT
      },
      transaction_date: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('transaction_patients')
  }
}