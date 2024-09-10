'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patients', {
      id: {
        type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true,
      }, nik: {
        type: Sequelize.STRING, allowNull: true,
      }, vaccine_sequence: {
        type: Sequelize.TINYINT, allowNull: true,
      }, last_vaccine_at : {
        type: Sequelize.DATE, allowNull: true,
      }, created_at: {
        type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, updated_at: {
        type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, deleted_at: {
        type: Sequelize.DATE, allowNull: true,
      }
    }).catch((err) => {
      console.log(err)
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patients')
  },
}
