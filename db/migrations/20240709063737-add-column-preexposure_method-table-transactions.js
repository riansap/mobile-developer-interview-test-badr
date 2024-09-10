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

    const transaction = await queryInterface.describeTable('transactions')

    if(!transaction.preexposure_method)
      await queryInterface.addColumn('transactions', 'preexposure_method', {
        type: Sequelize.TINYINT,
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

    await queryInterface.removeColumn('transactions', 'preexposure_method')
  }
};
