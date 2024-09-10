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

    if (!mappingMaterial.name_kfa_ingredients)
      await queryInterface.addColumn('mapping_master_materials', 'name_kfa_ingredients', {
        type: Sequelize.STRING,
        allowNull: true
      })

      if (!mappingMaterial.name_kfa_product_template)
      await queryInterface.addColumn('mapping_master_materials', 'name_kfa_product_template', {
        type: Sequelize.STRING,
        allowNull: true
      })

      if (!mappingMaterial.name_kfa_product_variant)
      await queryInterface.addColumn('mapping_master_materials', 'name_kfa_product_variant', {
        type: Sequelize.STRING,
        allowNull: true
      })

      if (!mappingMaterial.name_kfa_packaging)
      await queryInterface.addColumn('mapping_master_materials', 'name_kfa_packaging', {
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

    await queryInterface.removeColumn('mapping_master_materials', 'name_kfa_ingredients')
    await queryInterface.removeColumn('mapping_master_materials', 'name_kfa_product_template')
    await queryInterface.removeColumn('mapping_master_materials', 'name_kfa_product_variant')
    await queryInterface.removeColumn('mapping_master_materials', 'name_kfa_packaging')
  }
};
