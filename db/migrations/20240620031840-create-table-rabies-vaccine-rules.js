'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable('rabies_vaccine_rules', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        sequence: {
          allowNull: false,
          type: Sequelize.TINYINT
        },
        active_duration: {
          allowNull: true,
          type: Sequelize.INTEGER
        },
        next_duration: {
          allowNull: true,
          type: Sequelize.INTEGER
        },
        start_notification: {
          allowNull: true,
          type: Sequelize.INTEGER
        },
        end_notification: {
          allowNull: true,
          type: Sequelize.INTEGER
        },
        created_at: {
          allowNull: true,
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

    } catch (err) {
      console.log(err)
    }

  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('rabies_vaccine_rules')
  }
};
