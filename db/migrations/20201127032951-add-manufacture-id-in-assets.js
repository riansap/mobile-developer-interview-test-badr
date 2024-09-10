'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('assets', 'manufacture_id', {
      type: Sequelize.INTEGER,
      nullable: true
    })
    await queryInterface.addConstraint('assets', {
      type: 'foreign key',
      name: 'asset_manufacture_id',
      fields: ['manufacture_id'],
      references: {
        table: 'manufactures',
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
    await queryInterface.removeColumn('assets', 'manufacture_id')
  }
}
