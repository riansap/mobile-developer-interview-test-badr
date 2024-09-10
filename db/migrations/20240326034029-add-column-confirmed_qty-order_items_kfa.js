'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const orderItem = await queryInterface.describeTable('order_items_kfa')
    if(!orderItem.confirmed_qty)
      await queryInterface.addColumn('order_items_kfa', 'confirmed_qty', {
        type: Sequelize.DOUBLE,
        allowNull: true
      })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('order_items_kfa', 'confirmed_qty')
  }
};
