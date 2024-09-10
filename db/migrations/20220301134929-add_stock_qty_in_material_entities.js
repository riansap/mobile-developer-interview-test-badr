'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('material_entity', 'on_hand_qty', {
      allowNull: false,
      type: Sequelize.INTEGER,
      defaultValue: 0,
    })
    await queryInterface.addColumn('material_entity', 'allocated_qty', {
      allowNull: false,
      type: Sequelize.INTEGER,
      defaultValue: 0,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('material_entity', 'on_hand_qty')
    await queryInterface.removeColumn('material_entity', 'allocated_qty')
  }
};
