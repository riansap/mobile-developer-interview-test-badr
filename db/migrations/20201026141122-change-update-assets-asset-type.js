'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('assets', 'working_status')
    await queryInterface.addColumn('asset_types', 'type', Sequelize.TINYINT)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('assets', 'working_status', Sequelize.TINYINT)
    await queryInterface.removeColumn('asset_types', 'type')
  }
}
