'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('entities', 'sub_district_id', Sequelize.STRING)
    await queryInterface.addConstraint('entities', {
      type: 'foreign key',
      name: 'entities_sub_district',
      fields: ['sub_district_id'],
      references: {
        table: 'sub_districts',
        field: 'id'
      },
      nullable: true,
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
    await queryInterface.removeConstraint('entities', 'entities_sub_district')
    await queryInterface.removeColumn('entities', 'sub_district_id')
  }
}
