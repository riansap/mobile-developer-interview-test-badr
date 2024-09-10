'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'reason', Sequelize.TINYINT)
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'reason')
  }
}
