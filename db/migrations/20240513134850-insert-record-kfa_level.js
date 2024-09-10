'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface
      .bulkInsert('kfa_levels', [
        {
          id: 2,
          code: 92,
          order_number: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          code: 93,
          order_number: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .catch((err) => {
        console.log(err)
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const Op = Sequelize.Op
    await queryInterface.bulkDelete(
      'kfa_levels',
      { id: { [Op.in]: [2, 3] } },
      {}
    )
  },
}
