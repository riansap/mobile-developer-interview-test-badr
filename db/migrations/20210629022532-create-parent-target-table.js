'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('yearly_parent_has_target', {
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
      yearly_parent_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'yearly_parent',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      propotion: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      qty: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      custom_qty: {
        allowNull: true,
        type: Sequelize.INTEGER,
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
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('yearly_parent_has_target')
  },
}
