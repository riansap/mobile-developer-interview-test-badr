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
    if(!orderItem.reason_id)
      await queryInterface.addColumn('order_items_kfa', 'reason_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      })

    if(!orderItem.other_reason)
      await queryInterface.addColumn('order_items_kfa', 'other_reason', {
        type: Sequelize.STRING,
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
    await queryInterface.removeColumn('order_items_kfa', 'reason_id')
    await queryInterface.removeColumn('order_items_kfa', 'other_reason')
  }
};
