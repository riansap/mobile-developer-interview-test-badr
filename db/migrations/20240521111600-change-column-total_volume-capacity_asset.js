'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('order_item_projection_capacities', 'capacity_asset', {
      allowNull: true,
      type: Sequelize.FLOAT
    })
    await queryInterface.changeColumn('order_item_projection_capacities', 'total_volume', {
      allowNull: true,
      type: Sequelize.FLOAT
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
}
