'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('new_opnames', {
      fields: ['period_id'],
      type: 'FOREIGN KEY',
      name: 'FK_opname_period_new_opnames', // useful if using queryInterface.removeConstraint
      references: {
        table: 'opname_period',
        field: 'id',
      },
      onDelete: 'no action',
      onUpdate: 'no action',
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('new_opnames', 'FK_opname_period_new_opnames')
  }
};
