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

    const coldstorageMaterial = await queryInterface.describeTable('coldstorage_materials');

    if (!coldstorageMaterial.volume_per_liter)
      await queryInterface.addColumn('coldstorage_materials', 'volume_per_liter', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("coldstorage_materials", "volume_per_liter");
  }
};
