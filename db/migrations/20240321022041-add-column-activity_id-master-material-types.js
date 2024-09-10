'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const masterMaterialType = await queryInterface.describeTable('master_material_type');

    if (!masterMaterialType.activity_id)
      await queryInterface.addColumn('master_material_type', 'activity_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('master_material_type', 'activity_id')
  }
};
