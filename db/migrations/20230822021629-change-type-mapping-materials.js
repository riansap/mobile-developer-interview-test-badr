'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('mapping_master_materials', 'code_kfa_ingredients', {
      allowNull: true,
      type: Sequelize.STRING(20),
    })

    await queryInterface.changeColumn('mapping_master_materials', 'code_kfa_product_template', {
      allowNull: true,
      type: Sequelize.STRING(20),
    })

    await queryInterface.changeColumn('mapping_master_materials', 'code_kfa_product_variant', {
      allowNull: true,
      type: Sequelize.STRING(20),
    })

    await queryInterface.changeColumn('mapping_master_materials', 'code_kfa_packaging', {
      allowNull: true,
      type: Sequelize.STRING(20),
    })

    await queryInterface.changeColumn('mapping_master_materials', 'id_kfa', {
      allowNull: true,
      type: Sequelize.STRING(20),
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
}
