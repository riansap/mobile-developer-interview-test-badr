'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('transactions', 'open_vial', {
      type: Sequelize.DOUBLE,
    })
    await queryInterface.addColumn('transactions', 'close_vial', {
      type: Sequelize.DOUBLE,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('transactions', 'open_vial')
    await queryInterface.removeColumn('transactions', 'close_vial')
  }
};
