'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('biofarma_orders', 'jm_vial_terima', {
      type: Sequelize.INTEGER
    })
    await queryInterface.addColumn('biofarma_orders', 'jm_dosis_terima', {
      type: Sequelize.INTEGER
    })
    await queryInterface.addColumn('biofarma_orders', 'tanggal_kirim', {
      type: Sequelize.DATE
    })
    await queryInterface.addColumn('biofarma_orders', 'biofarma_type', {
      type: Sequelize.STRING
    })
    await queryInterface.addIndex('biofarma_orders', ['biofarma_type'])
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeIndex('biofarma_orders', 'biofarma_orders_biofarma_type')
    await queryInterface.removeColumn('biofarma_orders', 'jm_vial_terima')
    await queryInterface.removeColumn('biofarma_orders', 'jm_dosis_terima')
    await queryInterface.removeColumn('biofarma_orders', 'tanggal_kirim')
    await queryInterface.removeColumn('biofarma_orders', 'biofarma_type')
  }
}
