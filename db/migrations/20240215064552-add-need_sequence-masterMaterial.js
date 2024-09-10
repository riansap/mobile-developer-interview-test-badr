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

    const masterMaterial = await queryInterface.describeTable('master_materials');

    if (!masterMaterial.need_sequence)
      await queryInterface.addColumn('master_materials', 'need_sequence', {
        type: Sequelize.BOOLEAN,
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

    await queryInterface.removeColumn('master_materials', 'need_sequence')
  }
};
