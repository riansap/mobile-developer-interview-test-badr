'use strict'
const sequelize = require('sequelize')
const { Op } = sequelize

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('material_tags', 'is_ordered_sales', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    })
    await queryInterface.addColumn('material_tags', 'is_ordered_purchase', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    })
    await queryInterface.bulkUpdate('material_tags', { is_ordered_sales: false }, {
      title: 'Vial Terbuka'
    })
    await queryInterface.bulkUpdate('material_tags', { is_ordered_purchase: false }, {
      [Op.or]: [
        { title: 'Vial Terbuka' },
        { title: 'COVID-19' }
      ]
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('material_tags', 'is_ordered_sales')
    await queryInterface.removeColumn('material_tags', 'is_ordered_purchase')
  }
}
