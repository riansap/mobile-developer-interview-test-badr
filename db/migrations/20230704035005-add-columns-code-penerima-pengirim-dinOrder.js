'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const dinOrder = await queryInterface.describeTable('din_orders');

    if (!dinOrder.kode_pengirim)
      await queryInterface.addColumn('din_orders', 'kode_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kode_penerima)
      await queryInterface.addColumn('din_orders', 'kode_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('din_orders', 'kode_pengirim')
    await queryInterface.removeColumn('din_orders', 'kode_penerima')
  }
};
