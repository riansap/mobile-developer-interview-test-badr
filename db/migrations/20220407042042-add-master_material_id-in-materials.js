'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('materials', 'master_material_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'master_materials',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addColumn('materials', 'master_activity_id', {
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
    await queryInterface.removeColumn('materials', 'master_material_id')
    await queryInterface.removeColumn('materials', 'master_activity_id')
  }
};
