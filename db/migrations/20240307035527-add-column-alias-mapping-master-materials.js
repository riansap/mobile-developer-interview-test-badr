'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const mappingMaterial = await queryInterface.describeTable('mapping_master_materials');

    if (!mappingMaterial.alias_name)
      await queryInterface.addColumn('mapping_master_materials', 'asik_name', {
        type: Sequelize.STRING,
        allowNull: true
      })


  },

  async down(queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('mapping_master_materials', 'asik_name')
  }
};
