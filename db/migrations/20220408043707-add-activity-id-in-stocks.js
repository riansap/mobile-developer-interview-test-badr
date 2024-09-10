'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('stocks', 'entity_has_material_id', {
      type: Sequelize.BIGINT,
      references: {
        model: 'entity_has_master_materials',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addColumn('stocks', 'activity_id', {
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
    await queryInterface.removeColumn('stocks', 'entity_has_material_id')
    await queryInterface.removeColumn('stocks', 'activity_id')
  }
};
