'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('materials', 'code', {
      type: Sequelize.STRING
    })
    await queryInterface.addColumn('entities', 'code', {
      type: Sequelize.STRING
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('materials', 'code')
    await queryInterface.removeColumn('entities', 'code')
  }
}
