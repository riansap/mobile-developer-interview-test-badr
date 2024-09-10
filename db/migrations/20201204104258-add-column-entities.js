'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('entities', 'province_id', Sequelize.STRING)
    await queryInterface.addColumn('entities', 'regency_id', Sequelize.STRING)

    await queryInterface.addConstraint('entities', {
      type: 'foreign key',
      name: 'entities_ibfk_6',
      fields: ['province_id'],
      references: {
        table: 'provinces',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.addConstraint('entities', {
      type: 'foreign key',
      name: 'entities_ibfk_7',
      fields: ['regency_id'],
      references: {
        table: 'regencies',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('entities', 'entities_ibfk_6')
    await queryInterface.removeConstraint('entities', 'entities_ibfk_7')

    await queryInterface.removeColumn('entities', 'province_id')
    await queryInterface.removeColumn('entities', 'regency_id')
  }
}
