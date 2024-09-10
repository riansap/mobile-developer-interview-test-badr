'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const masterMaterials = await queryInterface.describeTable(
      'master_materials'
    )

    if (!masterMaterials.parent_id)
      await queryInterface.addColumn('master_materials', 'parent_id', {
        allowNull: true,
        type: Sequelize.INTEGER,
      })

    if (!masterMaterials.kfa_level_id)
      await queryInterface.addColumn('master_materials', 'kfa_level_id', {
        allowNull: true,
        type: Sequelize.INTEGER,
      })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('master_materials', 'parent_id')
    await queryInterface.removeColumn('master_materials', 'kfa_level_id')
  },
}
