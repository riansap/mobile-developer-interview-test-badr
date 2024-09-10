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

    const mappingMaterial = await queryInterface.describeTable('mapping_master_materials');

    if (!mappingMaterial.code_bpom)
      await queryInterface.addColumn('mapping_master_materials', 'code_bpom', {
        allowNull: true,
        type: Sequelize.STRING(25)
      })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("mapping_master_materials", "code_bpom");
  }
};
