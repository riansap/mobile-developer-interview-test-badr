'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'actual_shipment', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'estimated_date',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'actual_shipment');
  },
};
