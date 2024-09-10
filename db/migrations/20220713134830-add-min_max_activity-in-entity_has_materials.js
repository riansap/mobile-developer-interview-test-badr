'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('entity_master_material_activities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      entity_master_material_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'entity_has_master_materials',
          key: 'id',
        }
      },
      activity_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'master_activities',
          key: 'id',
        }
      },
      min: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      max: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('entity_master_material_activities')
  }
}
