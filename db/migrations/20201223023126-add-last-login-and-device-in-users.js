'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('users', 
      'last_login', {
        type: Sequelize.DATE,
        nullable: true
      }
    )

    await queryInterface.addColumn('users', 
      'last_device', {
        type: Sequelize.TINYINT
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
    await queryInterface.removeColumn('users', 'last_login')
    await queryInterface.removeColumn('users', 'last_device')
  }
}
