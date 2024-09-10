'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_types', {
      id: {
        type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true,
      }, title: {
        type: Sequelize.STRING, allowNull: false,
      }, type: {
        type: Sequelize.STRING, allowNull: false,
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
    await queryInterface.dropTable('notification_types')
  },
}
