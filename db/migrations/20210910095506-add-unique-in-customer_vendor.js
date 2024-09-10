'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addIndex(
      'customer_vendors',
      ['customer_id', 'vendor_id', 'is_distribution', 'is_consumption'],
      {
        name: 'customer_vendors_index',
        unique: true,
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
    await queryInterface.removeConstraint('customer_vendors', 'customer_vendors_index')
  }
}
