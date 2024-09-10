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
    let path = './public/csv/materials.csv'
    let data = await csv({ delimiter: ';' }).fromFile(path)
    let materials = await Promise.all(data.map(item => {
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        pieces_per_unit: item.pieces_per_unit,
        unit: item.unit,
        temperature_sensitive: item.temperature_sensitive,
        temperature_min: item.temperature_min === 'NULL' ? 0 : item.temperature_min,
        temperature_max: item.temperature_max === 'NULL' ? 0 : item.temperature_max,
        managed_in_batch: item.managed_in_batch,
        code: item.code === 'NULL' ? null : item.code,
        created_by: 1,
        updated_by: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    }))
    await queryInterface.bulkInsert('materials', materials, {ignoreDuplicates: true})
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('materials', null, {})
  }
}
