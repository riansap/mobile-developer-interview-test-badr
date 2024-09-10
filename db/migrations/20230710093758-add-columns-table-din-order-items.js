'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const dinOrderItem = await queryInterface.describeTable('din_order_items');

    if (!dinOrderItem.production_date)
      await queryInterface.addColumn('din_order_items', 'production_date', {
        allowNull: true,
        type: Sequelize.DATE
      })

    if (!dinOrderItem.unit_price)
      await queryInterface.addColumn('din_order_items', 'unit_price', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrderItem.total_price)
      await queryInterface.addColumn('din_order_items', 'total_price', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrderItem.unit)
      await queryInterface.addColumn('din_order_items', 'unit', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrderItem.tanggal_release)
      await queryInterface.addColumn('din_order_items', 'tanggal_release', {
        allowNull: true,
        type: Sequelize.DATE
      })

    if (!dinOrderItem.keterangan)
      await queryInterface.addColumn('din_order_items', 'keterangan', {
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
    await queryInterface.removeColumn('din_order_items', 'production_date')
    await queryInterface.removeColumn('din_order_items', 'unit_price')
    await queryInterface.removeColumn('din_order_items', 'total_price')
    await queryInterface.removeColumn('din_order_items', 'unit')
    await queryInterface.removeColumn('din_order_items', 'tanggal_release')
    await queryInterface.removeColumn('din_order_items', 'keterangan')
  }
};
