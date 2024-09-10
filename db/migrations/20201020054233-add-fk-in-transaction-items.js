'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addConstraint('transaction_items', {
      type: 'foreign key',
      name: 'transaction_item_created_by_fk',
      fields: ['created_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transaction_items', {
      type: 'foreign key',
      name: 'transaction_item_updated_by_fk',
      fields: ['updated_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transaction_items', {
      type: 'foreign key',
      name: 'transaction_item_stock_fk',
      fields: ['stock_id'],
      references: {
        table: 'stocks',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transaction_items', {
      type: 'foreign key',
      name: 'transaction_item_transaction_fk',
      fields: ['transaction_id'],
      references: {
        table: 'transactions',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
