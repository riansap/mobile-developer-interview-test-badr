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

    const emm_minmax = await queryInterface.describeTable('entity_master_material_minmax');

    if(!emm_minmax.year)
      await queryInterface.addColumn('entity_master_material_minmax', 'year', {
        type: Sequelize.INTEGER,
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

    await queryInterface.removeColumn('entity_master_material_minmax', 'year')
  }
};
