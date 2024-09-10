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
    const batch = await queryInterface.describeTable('batches');

    if (!batch.status)
      await queryInterface.addColumn('batches', 'status', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      })


  },

  async down(queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('batches', 'status')
  }
};
