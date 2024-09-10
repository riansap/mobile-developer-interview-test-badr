'use strict'

const { NOTIFICATION_TYPE } = require('../../dist/helpers/constants')


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
    await queryInterface.bulkInsert('notification_types', [
      {
        id: 15,
        title: 'Monthly Report',
        type: NOTIFICATION_TYPE.MONTHLY_REPORT,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 16,
        title: 'Yearly Report',
        type: NOTIFICATION_TYPE.YEARLY_REPORT,
        created_at: new Date(),
        updated_at: new Date()
      },
    ]).catch((err) => {
      console.log(err)
    })
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op
    await queryInterface.bulkDelete('notification_types', { id: { [Op.in]: [15, 16] } }, {})
  }
}
