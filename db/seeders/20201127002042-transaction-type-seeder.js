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
    await queryInterface.bulkInsert('transaction_types', [
      {
        id: 1,
        title: 'Hitung Transaksi',
        createdAt: new Date(),
        updatedAt: new Date(),
        chg_type: 2
      },
      {
        id: 2,
        title: 'Pengeluaran',
        createdAt: new Date(),
        updatedAt: new Date(),
        chg_type: 3
      },
      {
        id: 3,
        title: 'Diterima',
        createdAt: new Date(),
        updatedAt: new Date(),
        chg_type: 1
      },
      {
        id: 4,
        title: 'Pembuangan',
        createdAt: new Date(),
        updatedAt: new Date(),
        chg_type: 3
      },
    ], {ignoreDuplicates: true})
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('transaction_types', null, {})
  }
}
