'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeColumn('stocks', 'material_id')
    await queryInterface.removeColumn('stocks', 'entity_id')
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.addColumn('stocks', 
      'material_id', {
        type: Sequelize.BIGINT
      }
    )
    await queryInterface.addColumn('stocks', 
      'entity_id', {
        type: Sequelize.BIGINT
      }
    )
  }
}
