'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('yearly_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      year: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      entity_regency_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'entities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      step: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.INTEGER,
      },
      created_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
      },
      updated_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
      },
      deleted_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
      },
      submitted_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
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
      submitted_at: {
        type: Sequelize.DATE,
      }
    })

    await queryInterface.addIndex(
      'yearly_plans',
      ['year', 'entity_regency_id'],
      {
        name: 'yearly_parent_index',
        unique: true,
      }
    )
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('yearly_plans')
  }
}
