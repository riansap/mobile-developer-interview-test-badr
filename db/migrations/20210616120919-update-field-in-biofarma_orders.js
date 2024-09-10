'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */ 
    await queryInterface.addColumn('biofarma_orders', 'service_type', {
      type: Sequelize.INTEGER,
    })
    await queryInterface.addColumn('biofarma_orders', 'no_document', {
      type: Sequelize.STRING,
    })
    await queryInterface.addColumn('biofarma_orders', 'released_date', {
      type: Sequelize.DATE,
    })
    await queryInterface.addColumn('biofarma_orders', 'notes', {
      type: Sequelize.TEXT,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('biofarma_orders', 'service_type')
    await queryInterface.removeColumn('biofarma_orders', 'no_document')
    await queryInterface.removeColumn('biofarma_orders', 'released_date')
    await queryInterface.removeColumn('biofarma_orders', 'notes')
  }
}
