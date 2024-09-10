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

    const annualPlanning = await queryInterface.describeTable('coldstorage_annual_planning')
    if(!annualPlanning.yearly_child_id)
      await queryInterface.addColumn('coldstorage_annual_planning', 'yearly_child_id', {
        type: Sequelize.BIGINT,
        allowNull: true
      })

    await queryInterface.addIndex('coldstorage_annual_planning', ['year', 'entity_id'], {
      name: 'year_entity_unique_index',
      unique: true
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex('coldstorage_annual_planning', 'year_entity_unique_index')
  }
};
