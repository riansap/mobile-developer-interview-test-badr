'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('yearly_parent', {
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

      province_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'entities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      regency_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'entities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
      },
    })
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('yearly_parent')
  },
}
