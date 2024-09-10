'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const entityMaterialAct = await queryInterface.describeTable('entity_master_material_activities');

    if (!entityMaterialAct.stock_on_hand)
      await queryInterface.addColumn('entity_master_material_activities', 'stock_on_hand', {
        allowNull: true,
        type: Sequelize.DOUBLE,
        defaultValue: 0,
        after: 'max'
      })

    if (!entityMaterialAct.allocated)
      await queryInterface.addColumn('entity_master_material_activities', 'allocated', {
        allowNull: true,
        type: Sequelize.DOUBLE,
        defaultValue: 0,
        after: 'max'
      })

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('entity_master_material_activities', 'stock_on_hand')
    await queryInterface.removeColumn('entity_master_material_activities', 'allocated')
  }
};
