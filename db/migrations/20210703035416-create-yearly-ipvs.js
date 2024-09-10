'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('yearly_child_has_ipvs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      master_ipv_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'master_ipvs',
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
      custom_ipv: {
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.dropTable('yearly_child_has_ipvs')
  }
}
