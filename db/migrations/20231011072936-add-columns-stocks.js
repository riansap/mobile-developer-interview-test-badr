'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const stock = await queryInterface.describeTable('stocks');

    if (!stock.budget_source)
      await queryInterface.addColumn('stocks', 'budget_source', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!stock.year)
      await queryInterface.addColumn('stocks', 'year', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!stock.price)
      await queryInterface.addColumn('stocks', 'price', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })

    if (!stock.total_price)
      await queryInterface.addColumn('stocks', 'total_price', {
        allowNull: true,
        type: Sequelize.DOUBLE
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('stocks', 'budget_source')
    await queryInterface.removeColumn('stocks', 'year')
    await queryInterface.removeColumn('stocks', 'price')
    await queryInterface.removeColumn('stocks', 'total_price')
  }
};
