'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('orders', 'is_kpcpen', {
      allowNull: false,
      defaultValue: 0,
      type: Sequelize.TINYINT,
    })

    await queryInterface.addColumn('orders', 'qty_kpcpen', {
      allowNull: false,
      defaultValue: 0,
      type: Sequelize.INTEGER,
    })

    await queryInterface.addColumn('orders', 'master_order_id', {
      type: Sequelize.BIGINT,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('orders', 'is_kpcpen')
    await queryInterface.removeColumn('orders', 'qty_kpcpen')
    await queryInterface.removeColumn('orders', 'master_order_id')
  }
}
