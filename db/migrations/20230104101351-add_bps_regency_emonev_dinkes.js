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
    await queryInterface.addColumn('integration_emonev_regencies', 'bps_regency_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      defaultValue: 0,
      after: 'regency_id'
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('integration_emonev_regencies', 'bps_regency_id')
  }
};
