'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_material_fk',
      fields: ['material_id'],
      references: {
        table: 'materials',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_customer_fk',
      fields: ['customer_id'],
      references: {
        table: 'entities',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_vendor_fk',
      fields: ['vendor_id'],
      references: {
        table: 'entities',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_type_fk',
      fields: ['transaction_type_id'],
      references: {
        table: 'transaction_types',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_reason_fk',
      fields: ['transaction_reason_id'],
      references: {
        table: 'transaction_reasons',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_entity_fk',
      fields: ['entity_id'],
      references: {
        table: 'entities',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_created_by_fk',
      fields: ['created_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('transactions', {
      type: 'foreign key',
      name: 'transaction_updated_by_fk',
      fields: ['updated_by'],
      references: {
        table: 'users',
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
    await queryInterface.removeConstraint('transactions', 'transaction_material_fk')
    await queryInterface.removeConstraint('transactions', 'transaction_customer_fk')
    await queryInterface.removeConstraint('transactions', 'transaction_vendor_fk')
    await queryInterface.removeConstraint('transactions', 'transaction_type_fk')
    await queryInterface.removeConstraint('transactions', 'transaction_reason_fk')
    await queryInterface.removeConstraint('transactions', 'transaction_entity_fk')
    await queryInterface.removeConstraint('transactions', 'transaction_created_by_fk')
    await queryInterface.removeConstraint('transactions', 'transaction_updated_by_fk')
  }
}
