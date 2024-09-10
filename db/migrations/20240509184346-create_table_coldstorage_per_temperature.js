'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coldstorage_per_temperature', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      coldstorage_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true 
      },
      entity_id: { 
        type: Sequelize.INTEGER, 
        allowNull: true 
      },
      range_temperature_id: { 
        type: Sequelize.BIGINT, 
        allowNull: true 
      },
      volume_asset: { 
        type: Sequelize.DOUBLE, 
        allowNull: true 
      },
      total_volume: { 
        type: Sequelize.DOUBLE, 
        allowNull: true 
      },
      percentage_capacity: { 
        type: Sequelize.DOUBLE, 
        allowNull: true 
      },
      created_at: { 
        type: Sequelize.DATE, 
        allowNull: false 
      },
      updated_at: { 
        type: Sequelize.DATE, 
        allowNull: false 
      },
      deleted_at: { 
        type: Sequelize.DATE, 
        allowNull: true 
      }
    })
    queryInterface.addIndex('coldstorage_per_temperature', ['coldstorage_id'])
    queryInterface.addIndex('coldstorage_per_temperature', ['entity_id'])
    queryInterface.addIndex('coldstorage_per_temperature', ['range_temperature_id'])
  },

  async down(queryInterface) {
    const foreignKeys = await queryInterface.getForeignKeysForTables(['coldstorage_per_temperature'])
    // Remove each foreign key constraint
    for (const foreignKey of foreignKeys['coldstorage_per_temperature']) {
      await queryInterface.removeConstraint('coldstorage_per_temperature', foreignKey)
    }
    await queryInterface.removeIndex('coldstorage_per_temperature', ['coldstorage_id'])
    await queryInterface.removeIndex('coldstorage_per_temperature', ['entity_id'])
    await queryInterface.removeIndex('coldstorage_per_temperature', ['range_temperature_id'])
    await queryInterface.dropTable('coldstorage_per_temperature')
  }
}
