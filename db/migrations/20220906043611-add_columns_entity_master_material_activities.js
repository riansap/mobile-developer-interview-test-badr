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

    if (!entityMaterialAct.consumption_rate)
      await queryInterface.addColumn('entity_master_material_activities', 'consumption_rate', {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      })

    if (!entityMaterialAct.retailer_price)
      await queryInterface.addColumn('entity_master_material_activities', 'retailer_price', {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      })

    if (!entityMaterialAct.tax)
      await queryInterface.addColumn('entity_master_material_activities', 'tax', {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0
      })

    if (!entityMaterialAct.deleted_at)
      await queryInterface.addColumn('entity_master_material_activities', 'deleted_at', {
        allowNull: true,
        after: 'updated_at',
        type: Sequelize.DATE
      })

    if (!entityMaterialAct.created_by)
      await queryInterface.addColumn('entity_master_material_activities', 'created_by', {
        allowNull: true,
        type: Sequelize.BIGINT
      })

    if (!entityMaterialAct.updated_by)
      await queryInterface.addColumn('entity_master_material_activities', 'updated_by', {
        allowNull: true,
        type: Sequelize.BIGINT
      })

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('entity_master_material_activities', 'consumption_rate')
    await queryInterface.removeColumn('entity_master_material_activities', 'retailer_price')
    await queryInterface.removeColumn('entity_master_material_activities', 'tax')
    await queryInterface.removeColumn('entity_master_material_activities', 'deleted_at')
    await queryInterface.removeColumn('entity_master_material_activities', 'created_by')
    await queryInterface.removeColumn('entity_master_material_activities', 'updated_by')
  }
};
