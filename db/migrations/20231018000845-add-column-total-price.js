'use strict';
const tableName = "order_stock_purchase"
const columns = ["total_price"]
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    
    const model = await queryInterface.describeTable(tableName);
    await Promise.all(columns.map(async columnName => {
      if (!model[columnName]) {
        await queryInterface.addColumn(tableName, columnName, {
          allowNull: true,
          type: Sequelize.DOUBLE
        })
      }
    }))
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const model = await queryInterface.describeTable(tableName);
    await Promise.all(columns.map(async columnName => {
      if (model[columnName]) {
        await queryInterface.removeColumn(tableName, columnName)
      }
    }))
  }
};
