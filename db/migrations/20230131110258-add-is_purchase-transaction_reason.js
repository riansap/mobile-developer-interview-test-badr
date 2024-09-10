'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const transactionReason = await queryInterface.describeTable('transaction_reasons');

    if (!transactionReason.is_purchase)
      await queryInterface.addColumn('transaction_reasons', 'is_purchase', {
        allowNull: true,
        type: Sequelize.INTEGER,
        defaultValue: 0
      })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('transaction_reasons', 'is_purchase')
  }
};
