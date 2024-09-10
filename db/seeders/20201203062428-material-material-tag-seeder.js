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
    let path = './public/csv/material_material_tag.csv'
    let data = await csv({ delimiter: ';' }).fromFile(path)
    let materialTags = await Promise.all(data.map(item => {
      return {
        material_id: item.material_id,
        material_tag_id: item.material_tag_id,
        created_at: new Date(),
        updated_at: new Date()
      }
    }))
    await queryInterface.bulkInsert('material_material_tag', materialTags, {ignoreDuplicates: true})
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('material_material_tag', null, {})
  }
}
