'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('master_target_regencies', {
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
      entity_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'entities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      qty: {
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
      }
    })

    await queryInterface.addIndex(
      'master_target_regencies',
      ['year']
    )
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('master_target_regencies')
  }
}
