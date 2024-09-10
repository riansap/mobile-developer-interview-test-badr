'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('coldchain_capacity_equipment', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code_pqs: {
        type: Sequelize.STRING,
        allowNull: false
      },
      capacity_nett_at_plus_5_c: {
        type: Sequelize.FLOAT
      },
      capacity_nett_at_minus_20_c: {
        type: Sequelize.FLOAT
      },
      capacity_nett_at_minus_86_c: {
        type: Sequelize.FLOAT
      },
      status: {
        defaultValue: true,
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('coldchain_capacity_equipment')
  }
}