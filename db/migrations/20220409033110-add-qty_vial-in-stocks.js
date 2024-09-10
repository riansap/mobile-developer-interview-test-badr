'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('stocks', 'open_vial', {
      allowNull: false,
      type: Sequelize.INTEGER,
      defaultValue: 0
    })
    await queryInterface.addColumn('stocks', 'close_vial', {
      allowNull: false,
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
    await queryInterface.removeColumn('stocks', 'open_vial')
    await queryInterface.removeColumn('stocks', 'close_vial')
  }
};
