'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('customer_vendors', {
      customer_id: {
        type: Sequelize.INTEGER
      },
      vendor_id: {
        type: Sequelize.INTEGER
      },
    })

    await queryInterface.addConstraint('customer_vendors', {
      type: 'foreign key',
      name: 'customer_id_fk',
      fields: ['customer_id'],
      references: {
        table: 'entities',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })

    await queryInterface.addConstraint('customer_vendors', {
      type: 'foreign key',
      name: 'vendor_id_fk',
      fields: ['vendor_id'],
      references: {
        table: 'entities',
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
    await queryInterface.dropTable('customer_vendors')
    try {
      await queryInterface.removeConstraint('customer_vendors', 'vendor_id_fk')
      await queryInterface.removeConstraint('customer_vendors', 'customer_id_fk')
    } catch (err) {
      console.error(err)
    }
  }
}
