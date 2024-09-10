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
    await queryInterface.bulkInsert('transaction_reasons', [
      {
        id: 1,
        title: 'Kesalahan Input',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 1
      },
      {
        id: 2,
        title: 'Audit',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 1
      },
      {
        id: 3,
        title: 'Perbedaan Stok',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 1
      },
      {
        id: 4,
        title: 'Pecah',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 4
      },
      {
        id: 5,
        title: 'Beku',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 4
      },
      {
        id: 6,
        title: 'Kadaluwarsa/ED',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 4
      },
      {
        id: 7,
        title: 'Rusak',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 4
      },
      {
        id: 8,
        title: 'Pengembalian Dalam Gedung',
        createdAt: new Date(),
        updatedAt: new Date(),
        transaction_type_id: 3
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
    await queryInterface.bulkDelete('transaction_reasons', null, {})
  }
}
