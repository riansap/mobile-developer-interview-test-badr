'use strict'
const csv = require('csvtojson')

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
    let path = './public/csv/manufactures.csv'
    let data = await csv({ delimiter: ';' }).fromFile(path)
    let manufactures = await Promise.all(data.map(item => {
      return {
        id: item.id,
        name: item.name,
        reference_id: item.reference_id,
        address: item.address,
        created_by: 1,
        updated_by: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    }))
    await queryInterface.bulkInsert('manufactures', manufactures, {ignoreDuplicates: true})
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('manufactures', null, {})
  }
}
