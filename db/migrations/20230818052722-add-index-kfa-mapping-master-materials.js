'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addIndex(
      'mapping_master_materials',
      ['id_material_smile', 'code_kfa_ingredients', 'code_kfa_product_template', 'code_kfa_product_variant', 'code_kfa_packaging', 'id_kfa', 'code_biofarma'],
      {
        name: 'kfa_unique_index',
        unique: true,
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('mapping_master_materials', 'kfa_unique_index')
  }
}
