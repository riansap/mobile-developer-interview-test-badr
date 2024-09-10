'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stocks', {
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
      entity_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      batch_id: {
        type: Sequelize.BIGINT
      },
      status: {
        type: Sequelize.SMALLINT
      },
      qty: {
        allowNull: false,
        type: Sequelize.DOUBLE
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
    await queryInterface.dropTable('stocks')
  }
}