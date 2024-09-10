'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('regions', {
      type: 'foreign key',
      name: 'regions_ibfk_1',
      fields: ['created_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('regions', {
      type: 'foreign key',
      name: 'regions_ibfk_2',
      fields: ['updated_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('regions', {
      type: 'foreign key',
      name: 'regions_ibfk_3',
      fields: ['deleted_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('regions', {
      type: 'foreign key',
      name: 'regions_ibfk_4',
      fields: ['parent_id'],
      references: {
        table: 'regions',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('regions', 'regions_ibfk_1')
    await queryInterface.removeConstraint('regions', 'regions_ibfk_2')
    await queryInterface.removeConstraint('regions', 'regions_ibfk_3')
    await queryInterface.removeConstraint('regions', 'regions_ibfk_4')
  }
}
