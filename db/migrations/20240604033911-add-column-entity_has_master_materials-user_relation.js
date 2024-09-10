'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const entityHasMasterMaterials = await queryInterface.describeTable('entity_has_master_materials')
    
    if (!entityHasMasterMaterials.created_by)
      await queryInterface.addColumn('entity_has_master_materials', 'created_by', {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
      })

    if (!entityHasMasterMaterials.updated_by)
      await queryInterface.addColumn('entity_has_master_materials', 'updated_by', {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
      })

    if (!entityHasMasterMaterials.deleted_by)
      await queryInterface.addColumn('entity_has_master_materials', 'deleted_by', {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
      })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('entity_has_master_materials', 'created_by')
    await queryInterface.removeColumn('entity_has_master_materials', 'updated_by')
    await queryInterface.removeColumn('entity_has_master_materials', 'deleted_by')
  }
}
