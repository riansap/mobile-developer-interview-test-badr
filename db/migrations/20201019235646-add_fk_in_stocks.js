'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addConstraint('stocks', {
      type: 'foreign key',
      name: 'stock_created_by_fk',
      fields: ['created_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('stocks', {
      type: 'foreign key',
      name: 'stock_updated_by_fk',
      fields: ['updated_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('stocks', {
      type: 'foreign key',
      name: 'stock_batch_fk',
      fields: ['batch_id'],
      references: {
        table: 'batches',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('stocks', {
      type: 'foreign key',
      name: 'stock_material_entity_fk',
      fields: ['material_entity_id'],
      references: {
        table: 'material_entity',
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
    await queryInterface.removeConstraint('stocks', 'stock_created_by_fk')
    await queryInterface.removeConstraint('stocks', 'stock_updated_by_fk')
    await queryInterface.removeConstraint('stocks', 'stock_batch_fk')
    await queryInterface.removeConstraint('stocks', 'stock_material_entity_fk')
  }
}
