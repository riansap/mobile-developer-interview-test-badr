'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.addIndex('extermination_transactions', ['extermination_transaction_type_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['material_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['master_material_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['activity_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['customer_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['vendor_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['entity_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['stock_extermination_id'], { transaction })
      await queryInterface.addIndex('extermination_transactions', ['order_id'], { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      console.error(err)
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.removeIndex('extermination_transactions', ['extermination_transaction_type_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['material_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['master_material_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['activity_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['customer_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['vendor_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['entity_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['stock_extermination_id'], { transaction })
      await queryInterface.removeIndex('extermination_transactions', ['order_id'], { transaction })
      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      console.error(err)
    }
  }
};
