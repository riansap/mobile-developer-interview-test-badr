'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('stock_intervals', 'customer_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'entities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
    await queryInterface.addColumn('stock_intervals', 'vendor_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'entities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
    await queryInterface.addColumn('stock_intervals', 'entity_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'entities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
    await queryInterface.addColumn('stock_intervals', 'material_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'materials',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
    await queryInterface.addColumn('stock_intervals', 'order_id', {
      type: Sequelize.BIGINT,
      references: {
        model: 'orders',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('stock_intervals', 'customer_id')
    await queryInterface.removeColumn('stock_intervals', 'vendor_id')
    await queryInterface.removeColumn('stock_intervals', 'entity_id')
    await queryInterface.removeColumn('stock_intervals', 'material_id')
    await queryInterface.removeColumn('stock_intervals', 'order_id')
  }
}
