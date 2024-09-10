'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('extermination_flows', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      title: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('extermination_flow_reasons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      flow_id: {
        type: Sequelize.BIGINT
      },
      transaction_reason_id: {
        type: Sequelize.BIGINT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.addColumn('stock_exterminations', 'flow_id', {
      type: Sequelize.BIGINT,
      after: 'transaction_reason_id',
      defaultValue: 1,
    })
    await queryInterface.bulkInsert('extermination_flows', [
      {
        title: 'A. Pengiriman Pemusnahan',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'B. Uji Coba',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'C. Pemusnahan Mandiri',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ])

    // Flow A. Pengiriman Pemusnahan
    await queryInterface.bulkInsert('extermination_flow_reasons', [
      {
        flow_id: 1,
        transaction_reason_id: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 1,
        transaction_reason_id: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 1,
        transaction_reason_id: 11,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 1,
        transaction_reason_id: 31,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 1,
        transaction_reason_id: 33,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ])

    // Flow B. Ujicoba
    await queryInterface.bulkInsert('extermination_flow_reasons', [
      {
        flow_id: 2,
        transaction_reason_id: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 2,
        transaction_reason_id: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 2,
        transaction_reason_id: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 2,
        transaction_reason_id: 11,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 2,
        transaction_reason_id: 32,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 2,
        transaction_reason_id: 34,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 2,
        transaction_reason_id: 59,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ])

    // Flow C. Pemusnahan Mandiri
    await queryInterface.bulkInsert('extermination_flow_reasons', [
      {
        flow_id: 3,
        transaction_reason_id: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        flow_id: 3,
        transaction_reason_id: 32,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ])

    await queryInterface.addConstraint('stock_exterminations', {
      type: 'foreign key',
      name: 'flow_id_fk',
      fields: ['flow_id'],
      references: {
        table: 'extermination_flows',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('stock_exterminations', 'flow_id_fk')
    await queryInterface.dropTable('extermination_flows')
    await queryInterface.dropTable('extermination_flow_reasons')
    await queryInterface.bulkDelete('extermination_flow_reasons', null, {})
    await queryInterface.removeColumn('stock_exterminations', 'flow_id')
  }
}
