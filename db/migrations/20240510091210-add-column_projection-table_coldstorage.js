'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const coldStorages = await queryInterface.describeTable('coldstorages')
    if (!coldStorages.projection_volume_asset)
      await queryInterface.addColumn('coldstorages', 'projection_volume_asset', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    if (!coldStorages.projection_total_volume)
      await queryInterface.addColumn('coldstorages', 'projection_total_volume', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    if (!coldStorages.projection_percentage_capacity)
      await queryInterface.addColumn('coldstorages', 'projection_percentage_capacity', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    const coldstoragePerTemperature = await queryInterface.describeTable('coldstorage_per_temperature')
    if (!coldstoragePerTemperature.projection_volume_asset)
      await queryInterface.addColumn('coldstorage_per_temperature', 'projection_volume_asset', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })
  
    if (!coldstoragePerTemperature.projection_total_volume)
      await queryInterface.addColumn('coldstorage_per_temperature', 'projection_total_volume', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })
  
    if (!coldstoragePerTemperature.projection_percentage_capacity)
      await queryInterface.addColumn('coldstorage_per_temperature', 'projection_percentage_capacity', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })
  },

  async down (queryInterface, ) {
    await queryInterface.removeColumn('coldstorages', 'projection_volume_asset')
    await queryInterface.removeColumn('coldstorages', 'projection_total_volume')
    await queryInterface.removeColumn('coldstorages', 'projection_percentage_capacity')

    await queryInterface.removeColumn('coldstorage_per_temperature', 'projection_volume_asset')
    await queryInterface.removeColumn('coldstorage_per_temperature', 'projection_total_volume')
    await queryInterface.removeColumn('coldstorage_per_temperature', 'projection_percentage_capacity')
  }
}
