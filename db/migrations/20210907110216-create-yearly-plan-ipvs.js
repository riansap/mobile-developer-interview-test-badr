'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('yearly_plan_has_ipvs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      yearly_plan_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'yearly_plans',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
      custom_ipv: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.DECIMAL(10,1),
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

    await queryInterface.addIndex(
      'yearly_plan_has_ipvs',
      ['master_ipv_id', 'yearly_plan_id'],
      {
        name: 'yp_has_target_index',
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
    await queryInterface.dropTable('yearly_plan_has_ipvs')
  }
}
