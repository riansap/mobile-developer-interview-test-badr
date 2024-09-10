'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('yearly_child_has_ipvs', 'custom_ipv', {
      type: Sequelize.DECIMAL(10,1),
      allowNull: false,
      defaultValue: 0
    })

    await queryInterface.changeColumn('master_ipvs', 'ipv', {
      type: Sequelize.DECIMAL(10,1),
      allowNull: false,
      defaultValue: 0
    })

    await queryInterface.changeColumn('yearly_child_has_results', 'ipv', {
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
