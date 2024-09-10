'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('yearly_parent_has_target', 'propotion', {
      type: Sequelize.DECIMAL(10,1),
      allowNull: false,
      defaultValue: 0
    })

    await queryInterface.changeColumn('yearly_child_has_target', 'propotion', {
      type: Sequelize.DECIMAL(10,1),
      allowNull: false,
      defaultValue: 0
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
}
