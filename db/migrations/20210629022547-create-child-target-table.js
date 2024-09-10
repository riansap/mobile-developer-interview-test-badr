'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('yearly_child_has_target', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      master_target_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'master_target',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      yearly_child_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'yearly_child',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      propotion: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      qty: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      custom_qty: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })

    await queryInterface.addIndex(
      'yearly_child_has_target',
      ['master_target_id', 'yearly_child_id'],
      {
        name: 'yc_has_target_index',
        unique: true,
      }
    )
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('yearly_child_has_target')
  },
}
