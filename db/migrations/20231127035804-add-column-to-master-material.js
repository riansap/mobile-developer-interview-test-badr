'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('master_materials');

    if (!table.unit_of_distribution)
      await queryInterface.addColumn('master_materials', 'unit_of_distribution', {
        allowNull: false,
        type: Sequelize.STRING,
        after: 'name'
      })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('master_materials', 'unit_of_distribution')
  }
};
