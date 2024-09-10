'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('entities', {
      type: 'foreign key',
      name: 'entities_ibfk_3',
      fields: ['created_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('entities', {
      type: 'foreign key',
      name: 'entities_ibfk_4',
      fields: ['updated_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('entities', {
      type: 'foreign key',
      name: 'entities_ibfk_5',
      fields: ['deleted_by'],
      references: {
        table: 'users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('entities', 'entities_ibfk_3')
    await queryInterface.removeConstraint('entities', 'entities_ibfk_4')
    await queryInterface.removeConstraint('entities', 'entities_ibfk_5')
  }
}
