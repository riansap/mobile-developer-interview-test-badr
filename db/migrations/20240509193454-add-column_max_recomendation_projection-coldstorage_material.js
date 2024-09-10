'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const masterMaterial = await queryInterface.describeTable('coldstorage_materials')
    if (!masterMaterial.max_dosage)
      await queryInterface.addColumn('coldstorage_materials', 'max_dosage', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    if (!masterMaterial.recommend_order_base_on_max)
      await queryInterface.addColumn('coldstorage_materials', 'recommend_order_base_on_max', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    if (!masterMaterial.projection_stock)
      await queryInterface.addColumn('coldstorage_materials', 'projection_stock', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    if (!masterMaterial.projection_vial_stock)
      await queryInterface.addColumn('coldstorage_materials', 'projection_vial_stock', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    if (!masterMaterial.projection_package_stock)
      await queryInterface.addColumn('coldstorage_materials', 'projection_package_stock', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })

    if (!masterMaterial.projection_package_volume)
      await queryInterface.addColumn('coldstorage_materials', 'projection_package_volume', {
        allowNull: true,
        type: Sequelize.DOUBLE,
      })
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('coldstorage_materials', 'max_dosage')
    await queryInterface.removeColumn('coldstorage_materials', 'recommend_order_base_on_max')
    await queryInterface.removeColumn('coldstorage_materials', 'projection_stock')
    await queryInterface.removeColumn('coldstorage_materials', 'projection_vial_stock')
    await queryInterface.removeColumn('coldstorage_materials', 'projection_package_stock')
    await queryInterface.removeColumn('coldstorage_materials', 'projection_package_volume')
  }
}
