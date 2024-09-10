'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('integration_ayo_sehat', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('integration_ayo_sehat', 'created_at_injection', { type: Sequelize.DATE, after: 'injection_qty' })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('integration_ayo_sehat');
     */
    await queryInterface.removeColumn('integration_ayo_sehat', 'created_at_injection')
  }
};
