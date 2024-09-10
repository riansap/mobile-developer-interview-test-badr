'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface
    await queryInterface.createTable('integration_ayo_sehat', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      vendor_id: {
        type: Sequelize.INTEGER,
      },
      customer_id: {
        type: Sequelize.INTEGER,
      },
      activity_id: {
        type: Sequelize.INTEGER,
      },
      material_id: {
        type: Sequelize.INTEGER,
      },
      stock_id: {
        type: Sequelize.BIGINT,
      },
      batch_id: {
        type: Sequelize.BIGINT,
      },
      status_vvm: {
        type: Sequelize.TINYINT
      },
      consumed_qty: {
        type: Sequelize.DOUBLE
      },
      consumed_qty_openvial: {
        type: Sequelize.DOUBLE
      },
      consumed_qty_closevial: {
        type: Sequelize.DOUBLE
      },
      transaction_id_consumed: {
        type: Sequelize.INTEGER
      },
      created_at_consumed_smile: {
        type: Sequelize.DATE
      },
      consumed_status: {
        type: Sequelize.TINYINT
      },
      session_id: {
        type: Sequelize.STRING
      },
      transaction_id_return: {
        type: Sequelize.INTEGER
      },
      return_qty: {
        type: Sequelize.DOUBLE
      },
      return_qty_openvial: {
        type: Sequelize.DOUBLE
      },
      return_qty_closevial: {
        type: Sequelize.DOUBLE
      },
      transaction_id_injection: {
        type: Sequelize.INTEGER
      },
      injection_qty: {
        type: Sequelize.DOUBLE
      },
      created_at_return_vaccination: {
        type: Sequelize.DATE
      },
      updated_at_return_vaccination: {
        type: Sequelize.DATE
      },
      return_status: {
        type: Sequelize.TINYINT
      },
      return_validation: {
        type: Sequelize.TINYINT
      },
      created_by: {
        type: Sequelize.BIGINT,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE
      },
    })

    await queryInterface.addIndex('integration_ayo_sehat', ['vendor_id'])
    await queryInterface.addIndex('integration_ayo_sehat', ['customer_id'])
    await queryInterface.addIndex('integration_ayo_sehat', ['activity_id'])
    await queryInterface.addIndex('integration_ayo_sehat', ['material_id'])
    await queryInterface.addIndex('integration_ayo_sehat', ['stock_id'])
    await queryInterface.addIndex('integration_ayo_sehat', ['batch_id'])
    await queryInterface.addIndex('integration_ayo_sehat', ['transaction_id_consumed'])
    await queryInterface.addIndex('integration_ayo_sehat', ['consumed_status'])
    await queryInterface.addIndex('integration_ayo_sehat', ['session_id'])
    await queryInterface.addIndex('integration_ayo_sehat', ['transaction_id_return'])
    await queryInterface.addIndex('integration_ayo_sehat', ['transaction_id_injection'])
    await queryInterface.addIndex('integration_ayo_sehat', ['created_at_return_vaccination'])
    await queryInterface.addIndex('integration_ayo_sehat', ['updated_at_return_vaccination'])
    await queryInterface.addIndex('integration_ayo_sehat', ['return_status'])
    await queryInterface.addIndex('integration_ayo_sehat', ['return_validation'])
    await queryInterface.addIndex('integration_ayo_sehat', ['created_at'])
    await queryInterface.addIndex('integration_ayo_sehat', ['updated_at'])
    await queryInterface.addIndex('integration_ayo_sehat', ['created_by'])
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('integration_ayo_sehat')
  }
}