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
    await queryInterface.bulkInsert('material_tags', [
      {
        id: 1,
        title: 'Imunisasi Rutin',
        created_at: new Date(),
        updated_at: new Date(),
        is_ordered_sales: 1,
        is_ordered_purchase: 1
      },
      {
        id: 2,
        title: 'BIAS',
        created_at: new Date(),
        updated_at: new Date(),
        is_ordered_sales: 1,
        is_ordered_purchase: 0
      },
      {
        id: 3,
        title: 'ORI',
        created_at: new Date(),
        updated_at: new Date(),
        is_ordered_sales: 1,
        is_ordered_purchase: 1
      },
      {
        id: 4,
        title: 'Kampanye',
        created_at: new Date(),
        updated_at: new Date(),
        is_ordered_sales: 1,
        is_ordered_purchase: 1
      },
      {
        id: 5,
        title: 'Vial Terbuka',
        created_at: new Date(),
        updated_at: new Date(),
        is_ordered_sales: 0,
        is_ordered_purchase: 1
      },
      {
        id: 6,
        title: 'COVID-19',
        created_at: new Date(),
        updated_at: new Date(),
        is_ordered_sales: 0,
        is_ordered_purchase: 0
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
    await queryInterface.bulkDelete('material_tags', null, {})
  }
}
