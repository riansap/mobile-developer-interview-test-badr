'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('event_reports', 'canceled_at', {
      allowNull: true,
      type: Sequelize.DATE,
    })
    await queryInterface.addColumn('event_reports', 'canceled_by', {
      allowNull: true,
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
    await queryInterface.removeColumn('event_reports', 'canceled_at')
    await queryInterface.removeColumn('event_reports', 'canceled_by')
  }
}
