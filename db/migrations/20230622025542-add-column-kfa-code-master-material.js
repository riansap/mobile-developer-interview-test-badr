'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const masterMaterial = await queryInterface.describeTable('master_materials');

    if (!masterMaterial.kfa_code)
      await queryInterface.addColumn('master_materials', 'kfa_code', {
        allowNull: true,
        type: Sequelize.STRING
      })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('master_materials', 'kfa_code')
  }
};
