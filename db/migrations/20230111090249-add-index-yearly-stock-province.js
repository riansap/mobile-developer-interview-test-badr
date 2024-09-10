'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addIndex(
      'yearly_stock_province',
      ['province_id', 'master_material_id', 'year'],
      {
        name: 'yearly_stock_province_unique_index',
        unique: true,
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('yearly_stock_province', 'yearly_stock_province_unique_index')
  }
}
