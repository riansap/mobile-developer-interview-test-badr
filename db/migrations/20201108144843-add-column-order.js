'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'device_type', Sequelize.TINYINT)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'device_type')
  }
}
