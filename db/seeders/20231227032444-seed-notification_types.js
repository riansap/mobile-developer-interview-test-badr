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
        id: 1,
        title: 'Expired in 1 day',
        type: NOTIFICATION_TYPE.EXPIRED_1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        title: 'Expired in 3 days',
        type: NOTIFICATION_TYPE.EXPIRED_3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        title: 'Expired in 10 days',
        type: NOTIFICATION_TYPE.EXPIRED_10,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        title: 'Expired in 14 days',
        type: NOTIFICATION_TYPE.EXPIRED_14,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        title: 'Expired in 30 days',
        type: NOTIFICATION_TYPE.EXPIRED_30,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 6,
        title: 'Order Created',
        type: NOTIFICATION_TYPE.ORDER_CREATE,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 7,
        title: 'Order Confirmed',
        type: NOTIFICATION_TYPE.ORDER_CONFIRM,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 8,
        title: 'Order Shipped',
        type: NOTIFICATION_TYPE.ORDER_SHIP,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 9,
        title: 'Capacity more than 80%',
        type: NOTIFICATION_TYPE.CAPACITY_80,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 10,
        title: 'Stock greater than max',
        type: NOTIFICATION_TYPE.OVER_STOCK,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 11,
        title: 'Stock lesser than min',
        type: NOTIFICATION_TYPE.LESS_STOCK,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 12,
        title: 'Material out of stock',
        type: NOTIFICATION_TYPE.ZERO_STOCK,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 13,
        title: 'Excursion Temp Max',
        type: NOTIFICATION_TYPE.ASSET_MAX,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 14,
        title: 'Excursion Temp Min',
        type: NOTIFICATION_TYPE.ASSET_MIN,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {ignoreDuplicates: true}).catch((err) => {
      console.log(err)
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('notification_types', null, {})
  }
}
