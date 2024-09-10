'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('biofarma_orders',
     'code_product_kemenkes', {
        type: Sequelize.STRING,
      }
    )
    await queryInterface.addColumn('biofarma_orders',
     'entrance_type', {
        type: Sequelize.STRING,
      }
    )
    await queryInterface.addColumn('biofarma_orders',
     'grant_country', {
        type: Sequelize.STRING,
      }
    )
    await queryInterface.addColumn('biofarma_orders',
     'manufacture_country', {
        type: Sequelize.STRING,
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
  }
};
