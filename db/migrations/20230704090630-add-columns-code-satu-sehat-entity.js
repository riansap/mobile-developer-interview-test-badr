'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const entity = await queryInterface.describeTable('entities');

    if (!entity.code_satu_sehat)
      await queryInterface.addColumn('entities', 'code_satu_sehat', {
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
    await queryInterface.removeColumn('entities', 'code_satu_sehat')
  }
};
