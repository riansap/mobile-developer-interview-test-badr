'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stop_notification_reasons', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type:{
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'rabies'
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

    await queryInterface.bulkInsert('stop_notification_reasons', [
      {
        id: 1,
        title: 'Hewan Penular Rabies Hidup',
        type: 'rabies',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        title: 'Hewan Penular Rabies Mati Bukan Rabies',
        type: 'rabies',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {ignoreDuplates: true})
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('stop_notification_reasons')
  }
}