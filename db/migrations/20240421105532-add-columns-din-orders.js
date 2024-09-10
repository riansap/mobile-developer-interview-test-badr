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

    const dinOrder = await queryInterface.describeTable('din_orders')
    if (!dinOrder.line_ref)
      await queryInterface.addColumn('din_orders', 'line_ref', {
        type: Sequelize.STRING,
        allowNull: true
      })

    if (!dinOrder.carrier_ref)
      await queryInterface.addColumn('din_orders', 'carrier_ref', {
        type: Sequelize.STRING,
        allowNull: true
      })

    if (!dinOrder.carrier)
      await queryInterface.addColumn('din_orders', 'carrier', {
        type: Sequelize.STRING,
        allowNull: true
      })

    const dinOrderItem = await queryInterface.describeTable('din_order_items')
    if (!dinOrderItem.lot_no)
      await queryInterface.addColumn('din_order_items', 'lot_no', {
        type: Sequelize.STRING,
        allowNull: true
      })


    await queryInterface.changeColumn('din_orders', 'sumber_dana', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('din_orders', 'line_ref')
    await queryInterface.removeColumn('din_orders', 'carrier_ref')
    await queryInterface.removeColumn('din_orders', 'carrier')
    await queryInterface.removeColumn('din_order_items' ,'lot_no')
  }
};
