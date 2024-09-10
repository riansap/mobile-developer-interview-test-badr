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
    const orderItem = await queryInterface.describeTable('order_items')
    if(!orderItem.order_item_kfa_id)
      await queryInterface.addColumn('order_items', 'order_item_kfa_id', {
        type: Sequelize.BIGINT,
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
    await queryInterface.removeColumn('order_items', 'order_item_kfa_id')
  }
};
