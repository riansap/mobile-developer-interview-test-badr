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

    const patient = await queryInterface.describeTable('patients')

    if(!patient.stop_notification)
      await queryInterface.addColumn('patients', 'stop_notification', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: 0
      })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('patients', 'stop_notification')
  }
};
