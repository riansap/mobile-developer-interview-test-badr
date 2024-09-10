'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tracking_log_eg', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nopol: {
        type: Sequelize.STRING
      },
      status_do: {
        type: Sequelize.STRING
      },
      curr_temp: {
        type: Sequelize.FLOAT,
        default_value:0.0
      },
      lat: {
        type: Sequelize.FLOAT,
        default_value:0.0
      },
      lon: {
        type: Sequelize.FLOAT,
        default_value:0.0
      },
      is_alarm: {
        type: Sequelize.INTEGER,
        default_value:0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_time: {
        allowNull: false,
        type: Sequelize.DATE
      }

    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tracking_log_eg')
  }
}