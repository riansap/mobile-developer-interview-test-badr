'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('master_activities', 'is_ordered_sales', {
      allowNull: false,
      type: Sequelize.TINYINT,
      defaultValue: 1
    })
    await queryInterface.addColumn('master_activities', 'is_ordered_purchase', {
      allowNull: false,
      type: Sequelize.TINYINT,
      defaultValue: 1
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('master_activities', 'is_ordered_sales')
    await queryInterface.removeColumn('master_activities', 'is_ordered_purchase')
  }
};
