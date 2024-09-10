'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('entity_has_master_materials', 'extermination_discard_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.addColumn('entity_has_master_materials', 'extermination_received_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.addColumn('entity_has_master_materials', 'extermination_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.addColumn('entity_has_master_materials', 'extermination_shipped_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
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
    await queryInterface.removeColumn('entity_has_master_materials', 'extermination_discard_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.removeColumn('entity_has_master_materials', 'extermination_received_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.removeColumn('entity_has_master_materials', 'extermination_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
    await queryInterface.removeColumn('entity_has_master_materials', 'extermination_shipped_qty', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 0
    })
  }
};
