'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('master_materials', 'bpom_code', {
      type: Sequelize.STRING,
    })
    await queryInterface.addColumn('master_materials', 'code', {
      type: Sequelize.STRING,
    })
    await queryInterface.addColumn('master_materials', 'description', {
      type: Sequelize.STRING,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('master_materials', 'bpom_code')
    await queryInterface.removeColumn('master_materials', 'code')
    await queryInterface.removeColumn('master_materials', 'description')
  }
};
