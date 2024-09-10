'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('order_stocks', 'fulfill_reason', Sequelize.TINYINT)
    await queryInterface.addColumn('order_stocks', 'other_reason', Sequelize.STRING)
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('order_stocks', 'fulfill_reason')
    await queryInterface.removeColumn('order_stocks', 'other_reason')
  }
}
