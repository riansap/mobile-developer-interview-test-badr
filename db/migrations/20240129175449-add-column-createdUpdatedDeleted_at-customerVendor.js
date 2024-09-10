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

    const customerVendor = await queryInterface.describeTable('customer_vendors');

    if (!customerVendor.created_at)
      await queryInterface.addColumn('customer_vendors', 'created_at', {
        type: Sequelize.DATE,
        allowNull: true
      })

    if (!customerVendor.updated_at)
      await queryInterface.addColumn('customer_vendors', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true
      })

    if (!customerVendor.deleted_at)
      await queryInterface.addColumn('customer_vendors', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true
      })

  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('customer_vendors', 'created_at')
    await queryInterface.removeColumn('customer_vendors', 'updated_at')
    await queryInterface.removeColumn('customer_vendors', 'deleted_at')
  }
};
