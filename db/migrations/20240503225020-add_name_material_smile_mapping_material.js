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
    const mappingMasterMaterial = await queryInterface.describeTable('mapping_master_materials')
    if (!mappingMasterMaterial.name_material_smile)
      await queryInterface.addColumn('mapping_master_materials', 'name_material_smile', {
        type: Sequelize.STRING,
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
    await queryInterface.removeColumn('mapping_master_materials', 'name_material_smile')
  }
};
