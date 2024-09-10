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

    const patient = await queryInterface.describeTable('patients');

    if (!patient.identity_type)
      await queryInterface.addColumn('patients', 'identity_type', {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1
      })

  },

  async down(queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('patients', 'identity_type')
  }
};
