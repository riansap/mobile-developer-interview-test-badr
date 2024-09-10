const csv = require('csvtojson')
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
    let path = './public/csv/material_manufacture.csv'
    let data = await csv({ delimiter: ';' }).fromFile(path)
    let materialManufactures = await Promise.all(data.map(item => {
      return {
        material_id: item.material_id,
        manufacture_id: item.manufacture_id,
        created_at: new Date(),
        updated_at: new Date()
      }
    }))
    await queryInterface.bulkInsert('material_manufacture', materialManufactures, {ignoreDuplicates: true})
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('material_manufacture', null, {})
  }
}

