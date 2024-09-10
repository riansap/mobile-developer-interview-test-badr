'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const { sequelize } = queryInterface
    const t = await sequelize.transaction()
    try {
      const [getNosId] = await sequelize.query(`
        SELECT max(nos.id) as id
        FROM new_opname_stocks nos
        LEFT JOIN new_opname_items noi ON noi.id=nos.new_opname_item_id
        LEFT JOIN new_opnames nop ON nop.id=noi.new_opname_id
        WHERE nop.period_id IS NOT NULL
        AND nop.deleted_at is null and noi.deleted_at is null and nos.deleted_at is null
        GROUP BY nop.entity_id, noi.master_material_id, nos.batch_code, nop.period_id, nop.activity_id
      `)
      const newOpnameStockId = getNosId.map((val) => val.id)
      console.log(newOpnameStockId.length);
      console.log(newOpnameStockId);
      await sequelize.query(`
        UPDATE new_opname_stocks ns
        SET ns.deleted_at = '2024-01-16 23:15:00'
        WHERE ns.id not in (:newOpnameStockId)
      `, {replacements: {newOpnameStockId}, transaction: t})
      
      await t.commit()
    } catch (err) {
      await t.rollback()
      console.error(err)
      throw err
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
