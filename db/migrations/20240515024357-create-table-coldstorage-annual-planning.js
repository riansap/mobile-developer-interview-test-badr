'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coldstorage_annual_planning', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      year: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      entity_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'entities',
          key: 'id'
        }
      },
      yearly_volume_need : {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      yearly_volume : {
        allowNull: true,
        type : Sequelize.DOUBLE
      },
      quartal_volume: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      peak_volume_q3: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      peak_volume_q4: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      monthly_volume: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      peak_volume_augustus: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      peak_volume_november: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      created_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updated_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      deleted_by: {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('coldstorage_annual_planning')
  }
};
