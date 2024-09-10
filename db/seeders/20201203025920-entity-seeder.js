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
    await queryInterface.bulkInsert('entities', [
      {
        id: 1,
        name: 'NASIONAL',
        address: 'INDONESIA, ID',
        created_at: new Date(),
        updated_at: new Date(),
        code: '00',
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
    await queryInterface.bulkDelete('entities', null, {})
  }
}
