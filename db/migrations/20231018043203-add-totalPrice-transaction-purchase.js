'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const transactionPurchase = await queryInterface.describeTable('transaction_purchase');

    if (!transactionPurchase.total_price)
      await queryInterface.addColumn('transaction_purchase', 'total_price', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('transaction_purchase', 'total_price')
  }
};
