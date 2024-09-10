'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('order_items',
      'reason_id', {
        type: Sequelize.INTEGER,
      }
    )
    await queryInterface.addColumn('order_items',
      'other_reason', {
        type: Sequelize.STRING,
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('order_items', 'reason_id')
    await queryInterface.removeColumn('order_items', 'other_reason')
  }
}
