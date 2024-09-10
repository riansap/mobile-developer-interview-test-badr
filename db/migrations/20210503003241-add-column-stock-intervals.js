'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('stock_intervals', 'material_name', Sequelize.STRING)
    await queryInterface.addColumn('stock_intervals', 'material_tags', Sequelize.STRING)
    await queryInterface.addColumn('stock_intervals', 'entity_name', Sequelize.STRING)
    await queryInterface.addColumn('stock_intervals', 'entity_tags', Sequelize.STRING)
    await queryInterface.addColumn('stock_intervals', 'entity_province_id', Sequelize.INTEGER)
    await queryInterface.addColumn('stock_intervals', 'entity_province_name', Sequelize.STRING)
    await queryInterface.addColumn('stock_intervals', 'entity_regency_id', Sequelize.INTEGER)
    await queryInterface.addColumn('stock_intervals', 'entity_regency_name', Sequelize.STRING)
    await queryInterface.addColumn('stock_intervals', 'entity_sub_district_id', Sequelize.INTEGER)
    await queryInterface.addColumn('stock_intervals', 'entity_sub_district_name', Sequelize.STRING)
    await queryInterface.addColumn('stock_intervals', 'entity_village_id', Sequelize.BIGINT)
    await queryInterface.addColumn('stock_intervals', 'entity_village_name', Sequelize.STRING)
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('stock_intervals', 'material_name')
    await queryInterface.removeColumn('stock_intervals', 'material_tags')
    await queryInterface.removeColumn('stock_intervals', 'entity_name')
    await queryInterface.removeColumn('stock_intervals', 'entity_tags')
    await queryInterface.removeColumn('stock_intervals', 'entity_province_id')
    await queryInterface.removeColumn('stock_intervals', 'entity_province_name')
    await queryInterface.removeColumn('stock_intervals', 'entity_regency_id')
    await queryInterface.removeColumn('stock_intervals', 'entity_regency_name')
    await queryInterface.removeColumn('stock_intervals', 'entity_sub_district_id')
    await queryInterface.removeColumn('stock_intervals', 'entity_sub_district_name')
    await queryInterface.removeColumn('stock_intervals', 'entity_village_id')
    await queryInterface.removeColumn('stock_intervals', 'entity_village_name')
  }
}
