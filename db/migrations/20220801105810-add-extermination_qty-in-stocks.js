'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('stocks', 'extermination_discard_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.addColumn('stocks', 'extermination_received_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.addColumn('stocks', 'extermination_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.addColumn('stocks', 'extermination_shipped_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
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
    await queryInterface.removeColumn('stocks', 'extermination_discard_qty')
    await queryInterface.removeColumn('stocks', 'extermination_received_qty')
    await queryInterface.removeColumn('stocks', 'extermination_qty')
    await queryInterface.removeColumn('stocks', 'extermination_shipped_qty')
  }
};
