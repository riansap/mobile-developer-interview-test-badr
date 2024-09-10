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
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        username: 'admin',
        email: 'info@smile-indonesia.id',
        password: '$2a$10$DVc9MVa9hhYaRI3IsKI.JOOeDlTvWBtrl10w0dB54iGTWh7rnCx4W',
        gender: 1,
        role: 1,
        created_at: new Date(),
        updated_at: new Date(),
        firstname: 'Admin',
        lastname: 'Nasional'
      }
    ], {ignoreDuplicates: true})
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('users', null, {})
  }
}
