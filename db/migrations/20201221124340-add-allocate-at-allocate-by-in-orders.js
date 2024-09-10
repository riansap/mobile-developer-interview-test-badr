'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('orders', 
      'allocated_at', {
        type: Sequelize.DATE,
        nullable: true
      })
    await queryInterface.addColumn('orders', 
      'allocated_by', {
        type: Sequelize.BIGINT,
        nullable: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('orders', 'allocated_at')
    await queryInterface.removeColumn('orders', 'allocated_by')
  }
}
