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

    const dinOrder = await queryInterface.describeTable('din_orders');

    if (!dinOrder.nama_pengirim)
      await queryInterface.addColumn('din_orders', 'nama_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kelurahan_pengirim)
      await queryInterface.addColumn('din_orders', 'kelurahan_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.type_penerima)
      await queryInterface.addColumn('din_orders', 'type_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kelurahan_id_pengirim)
      queryInterface.addColumn('din_orders', 'kelurahan_id_pengirim', {
        allowNull: true,
        type: Sequelize.BIGINT
      })

    if (!dinOrder.kelurahan_penerima)
      await queryInterface.addColumn('din_orders', 'kelurahan_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kelurahan_id_penerima)
      await queryInterface.addColumn('din_orders', 'kelurahan_id_penerima', {
        allowNull: true,
        type: Sequelize.BIGINT
      })

    if (dinOrder.biofarma_type)
      await queryInterface.renameColumn('din_orders', 'biofarma_type', 'din_type')


    const dinOrderItem = await queryInterface.describeTable('din_order_items')

    if (!dinOrderItem.note)
      await queryInterface.addColumn('din_order_items', 'note', {
        allowNull: true,
        type: Sequelize.STRING
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('din_orders', 'nama_pengirim')
    await queryInterface.removeColumn('din_orders', 'kelurahan_pengirim')
    await queryInterface.removeColumn('din_orders', 'kelurahan_id_pengirim')

    await queryInterface.removeColumn('din_orders', 'type_penerima')
    await queryInterface.removeColumn('din_orders', 'kelurahan_penerima')
    await queryInterface.removeColumn('din_orders', 'kelurahan_id_penerima')

    await queryInterface.removeColumn('din_order_items', 'note')
  }
};
