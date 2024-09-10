'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('event_report_items', 'material_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
    })
    await queryInterface.addColumn('event_report_items', 'custom_material', {
      type: Sequelize.STRING,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('event_report_items', 'custom_material')
  }
};
