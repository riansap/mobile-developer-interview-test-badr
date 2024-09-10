'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('customer_vendors', 'is_distribution', {
      allowNull: false,
      defaultValue: 1,
      type: Sequelize.TINYINT,
    })

    await queryInterface.addColumn('customer_vendors', 'is_consumption', {
      allowNull: false,
      defaultValue: 0,
      type: Sequelize.TINYINT,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('customer_vendors', 'is_distribution')
    await queryInterface.removeColumn('customer_vendors', 'is_consumption')
  }
}
