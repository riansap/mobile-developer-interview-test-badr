'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('dashboard_satusehat');

    if (!table.uuid)
      await queryInterface.addColumn('dashboard_satusehat', 'uuid', {
        allowNull: false,
        type: Sequelize.STRING,
        after: 'id'
      })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('dashboard_satusehat', 'uuid')
  }
};
