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

    const dinOrder = await queryInterface.describeTable('din_orders')
    if(!dinOrder.key_ssl)
      await queryInterface.addColumn('din_orders', 'key_ssl', {
        type: Sequelize.STRING,
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

    await queryInterface.removeColumn('din_orders', 'key_ssl')
  }
};
