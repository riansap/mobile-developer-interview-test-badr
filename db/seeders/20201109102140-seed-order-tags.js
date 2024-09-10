'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('order_tags', [
      {
        id: 1,
        title: 'Darurat',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        title: 'Ori',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        title: 'Rutin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        title: 'Covid',
        created_at: new Date(),
        updated_at: new Date()
      },
    ], {ignoreDuplicates : true}).catch((err) => {
      console.log(err)
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('order_tags', null, {})
  }
}
