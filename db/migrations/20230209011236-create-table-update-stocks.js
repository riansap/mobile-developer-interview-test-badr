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
    await queryInterface.createTable('update_stocks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      province_id: { type: Sequelize.INTEGER, allowNull: true },
      regency_id: { type: Sequelize.INTEGER, allowNull: true },
      master_material_id: { type: Sequelize.INTEGER, allowNull: true },
      qty: { type: Sequelize.INTEGER, allowNull: false },
      stocks: { type: Sequelize.TEXT, allowNull: true },
      date_cutoff: { type: Sequelize.DATEONLY, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: true, type: Sequelize.DATE },
      deletedAt: { allowNull: true, type: Sequelize.DATE }
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('update_stocks')
  }
};
