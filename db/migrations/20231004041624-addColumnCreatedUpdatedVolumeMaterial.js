'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const volumeMaterialManufacture = await queryInterface.describeTable('master_volume_material_manufactures');

    if (!volumeMaterialManufacture.created_by)
      await queryInterface.addColumn('master_volume_material_manufactures', 'created_by', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!volumeMaterialManufacture.updated_by)
      await queryInterface.addColumn('master_volume_material_manufactures', 'updated_by', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

      await queryInterface.addIndex(
        'master_volume_material_manufactures',
        ['master_material_id', 'manufacture_id'],
        {
          name: 'volume_material_manufacture_unique_index',
          unique: true,
        })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("master_volume_material_manufactures", "created_by");
    await queryInterface.removeColumn("master_volume_material_manufactures", "updated_by");
    await queryInterface.removeConstraint('master_volume_material_manufactures', 'volume_material_manufacture_unique_index')
  }
};
