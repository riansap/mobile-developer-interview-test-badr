'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.removeConstraint('stock_exterminations', 'flow_id_fk')
    await queryInterface.removeColumn('stock_exterminations', 'flow_id')
    await queryInterface.addColumn('extermination_transactions', 'flow_id', {
      type: Sequelize.BIGINT,
      after: 'extermination_transaction_type_id',
      defaultValue: 1,
    })
    await queryInterface.addIndex('extermination_transactions', ['flow_id'])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('extermination_transactions', 'flow_id')
    await queryInterface.addColumn('stock_exterminations', 'flow_id', {
      type: Sequelize.BIGINT,
      after: 'transaction_reason_id',
      defaultValue: 1,
    })
    await queryInterface.addConstraint('stock_exterminations', 'flow_id_fk')
  }
};
