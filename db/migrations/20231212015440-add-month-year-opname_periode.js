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

    const opnamePeriod = await queryInterface.describeTable('opname_period');

    if (!opnamePeriod.month_periode)
      await queryInterface.addColumn('opname_period', 'month_periode', {
        allowNull: true,
        type: Sequelize.TINYINT
      })

    if (!opnamePeriod.year_periode)
      await queryInterface.addColumn('opname_period', 'year_periode', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    await queryInterface.addIndex(
      'opname_period',
      ['month_periode', 'year_periode'],
      {
        name: 'month_year_unique_index',
        unique: true,
      }
    )
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('opname_period', 'month_year_unique_index')
    await queryInterface.removeColumn('opname_period', 'month_periode')
    await queryInterface.removeColumn('opname_period', 'year_periode')
  }
};
