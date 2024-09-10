'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('order_items', 'recommended_stock', Sequelize.BIGINT)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('order_items', 'recommended_stock')
  }
}
