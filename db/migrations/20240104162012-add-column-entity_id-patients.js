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

    const patient = await queryInterface.describeTable('patients');

    if(!patient.entity_id)
      await queryInterface.addColumn('patients', 'entity_id', {
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

    await queryInterface.removeColumn('patients', 'entity_id')
  }
};
