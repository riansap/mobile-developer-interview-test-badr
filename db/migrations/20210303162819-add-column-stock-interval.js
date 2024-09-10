'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('stock_intervals', 'stock_id', {
      type: Sequelize.BIGINT,
      references: {
        model: 'stocks',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
    await queryInterface.addColumn('stock_intervals', 'transaction_type_id', {
      type: Sequelize.INTEGER
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('stock_intervals', 'stock_id')
    await queryInterface.removeColumn('stock_intervals', 'transaction_type_id')
  }
}
