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

    const transactions = await queryInterface.describeTable('transactions');

    if (!transactions.patient_id)
      await queryInterface.addColumn('transactions', 'patient_id', {
        allowNull: true,
        type: Sequelize.STRING
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('transactions', 'patient_id')
  }
};
