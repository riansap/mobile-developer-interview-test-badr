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
    const annualPlanning = await queryInterface.describeTable('coldstorage_annual_planning')
    if (!annualPlanning.yearly_volume_need_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'yearly_volume_need_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!annualPlanning.yearly_volume_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'yearly_volume_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!annualPlanning.quartal_volume_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'quartal_volume_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!annualPlanning.peak_volume_q3_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'peak_volume_q3_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!annualPlanning.peak_volume_q4_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'peak_volume_q4_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!annualPlanning.monthly_volume_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'monthly_volume_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!annualPlanning.peak_volume_augustus_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'peak_volume_augustus_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!annualPlanning.peak_volume_november_percent)
      await queryInterface.addColumn('coldstorage_annual_planning', 'peak_volume_november_percent', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('coldstorage_annual_planning', 'yearly_volume_need_percent')
    await queryInterface.removeColumn('coldstorage_annual_planning', 'yearly_volume_percent')
    await queryInterface.removeColumn('coldstorage_annual_planning', 'quartal_volume_percent')
    await queryInterface.removeColumn('coldstorage_annual_planning', 'peak_volume_q3_percent')
    await queryInterface.removeColumn('coldstorage_annual_planning', 'peak_volume_q4_percent')
    await queryInterface.removeColumn('coldstorage_annual_planning', 'monthly_volume_percent')
    await queryInterface.removeColumn('coldstorage_annual_planning', 'peak_volume_augustus_percent')
    await queryInterface.removeColumn('coldstorage_annual_planning', 'peak_volume_november_percent')
  }
};
