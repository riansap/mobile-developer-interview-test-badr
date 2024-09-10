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

    const newOpname = await queryInterface.describeTable('new_opnames');

    if (!newOpname.status)
      await queryInterface.addColumn('new_opnames', 'status', {
        allowNull: true,
        type: Sequelize.TINYINT
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('new_opnames', 'status')
  }
};
