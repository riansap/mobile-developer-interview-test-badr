'use strict'

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addIndex('stock_intervals', ['date'], { transaction })
      await queryInterface.addIndex('stock_intervals', ['date', 'material_id'], { transaction })
      await queryInterface.addIndex('stock_intervals', ['date', 'entity_id'], { transaction })
      await queryInterface.addIndex('stock_intervals', ['date', 'material_id', 'entity_id'], { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      console.error(err)
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeIndex('stock_intervals', ['date'], { transaction })
      await queryInterface.removeIndex('stock_intervals', ['date', 'material_id'], { transaction })
      await queryInterface.removeIndex('stock_intervals', ['date', 'entity_id'], { transaction })
      await queryInterface.removeIndex('stock_intervals', ['date', 'material_id', 'entity_id'], { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      console.error(err)
    }
  }
}
