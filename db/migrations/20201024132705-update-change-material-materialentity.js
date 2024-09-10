'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('material_entity', 'min', Sequelize.DOUBLE)
    await queryInterface.addColumn('material_entity', 'max', Sequelize.DOUBLE)
    await queryInterface.removeColumn('materials', 'min')
    await queryInterface.removeColumn('materials', 'max')

    await queryInterface.removeColumn('material_entity', 'temperature_min')
    await queryInterface.removeColumn('material_entity', 'temperature_max')
    await queryInterface.addColumn('materials', 'temperature_min', Sequelize.DOUBLE)
    await queryInterface.addColumn('materials', 'temperature_max', Sequelize.DOUBLE)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('material_entity', 'min')
    await queryInterface.removeColumn('material_entity', 'max')
    await queryInterface.addColumn('materials', 'min', Sequelize.DOUBLE)
    await queryInterface.addColumn('materials', 'max', Sequelize.DOUBLE)

    await queryInterface.addColumn('material_entity', 'temperature_min', Sequelize.DOUBLE)
    await queryInterface.addColumn('material_entity', 'temperature_max', Sequelize.DOUBLE)
    await queryInterface.removeColumn('materials', 'temperature_min', Sequelize.DOUBLE)
    await queryInterface.removeColumn('materials', 'temperature_max', Sequelize.DOUBLE)
  }
}
