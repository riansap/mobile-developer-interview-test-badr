'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('transactions', 'dose_1', {
      type: Sequelize.INTEGER,
    })
    await queryInterface.addColumn('transactions', 'dose_2', {
      type: Sequelize.INTEGER,
    })
    await queryInterface.addColumn('transactions', 'booster', {
      type: Sequelize.INTEGER,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('transactions', 'dose_1')
    await queryInterface.removeColumn('transactions', 'dose_2')
    await queryInterface.removeColumn('transactions', 'booster')
  }
};
