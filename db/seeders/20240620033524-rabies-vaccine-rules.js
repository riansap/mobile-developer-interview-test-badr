'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('rabies_vaccine_rules', [
      {
        id: 1,
        sequence : 1,
        active_duration: 14,
        next_duration: 7,
        start_notification: 7,
        end_notification: 14,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        sequence : 2,
        active_duration: 21,
        next_duration: 7,
        start_notification: 14,
        end_notification: 21,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        sequence : 3,
        active_duration: 360,
        next_duration: 30,
        start_notification: 330,
        end_notification: 360,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        sequence : 4,
        active_duration: 360,
        next_duration: 3,
        start_notification: 3,
        end_notification: 7,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        sequence : 5,
        active_duration: 360,
        next_duration: null,
        start_notification: null,
        end_notification: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        sequence : 6,
        active_duration: null,
        next_duration: 3,
        start_notification: 7,
        end_notification: 14,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        sequence : 7,
        active_duration: null,
        next_duration: null,
        start_notification: null,
        end_notification: null,
        created_at: new Date(),
        updated_at: new Date()
      },
    ]).catch((err) => {
      console.log(err)
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('rabies_vaccine_rules', null, {})
  }
}
