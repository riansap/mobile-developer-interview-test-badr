'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const order = await queryInterface.describeTable('orders');

    if (!order.is_manual)
      await queryInterface.addColumn('orders', 'is_manual', {
        allowNull: true,
        type: Sequelize.TINYINT
      })

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('orders', 'is_manual')
  }
};
