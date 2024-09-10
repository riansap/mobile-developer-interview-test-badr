'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('yearly_child', 'yearly_plan_id', {
      type: Sequelize.BIGINT,
      references: {
        model: 'yearly_plans',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.removeColumn('yearly_child', 'year')
    await queryInterface.removeColumn('yearly_child', 'province_id')
    await queryInterface.removeColumn('yearly_child', 'regency_id')

    await queryInterface.addColumn('yearly_parent_has_target', 'yearly_plan_id', {
      type: Sequelize.BIGINT,
      references: {
        model: 'yearly_plans',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.removeColumn('yearly_parent_has_target', 'yearly_parent_id')
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('yearly_child', 'yearly_plan_id')
    await queryInterface.addColumn('yearly_child', 'year', {
      type: Sequelize.INTEGER
    })
    await queryInterface.addColumn('yearly_child', 'province_id', {
      type: Sequelize.INTEGER
    })
    await queryInterface.addColumn('yearly_child', 'regency_id', {
      type: Sequelize.INTEGER
    })
    await queryInterface.removeColumn('yearly_parent_has_target', 'yearly_plan_id')
    await queryInterface.addColumn('yearly_parent_has_target', 'yearly_parent_id', {
      type: Sequelize.INTEGER
    })
  }
}
