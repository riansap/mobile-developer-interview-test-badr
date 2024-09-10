'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('order_stocks', 'allocated_qty', Sequelize.DOUBLE)
    await queryInterface.changeColumn('order_stocks', 'received_qty', Sequelize.DOUBLE)
    await queryInterface.changeColumn('order_stocks', 'ordered_qty', Sequelize.DOUBLE)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('order_stocks', 'allocated_qty', Sequelize.FLOAT)
    await queryInterface.changeColumn('order_stocks', 'received_qty', Sequelize.FLOAT)
    await queryInterface.changeColumn('order_stocks', 'ordered_qty', Sequelize.FLOAT)
  }
}
