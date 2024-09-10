'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('transactions', 'master_material_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'master_materials',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })

    await queryInterface.addColumn('transactions', 'activity_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'master_activities',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('transactions', 'master_material_id')
    await queryInterface.removeColumn('transactions', 'activity_id')
  }
};
