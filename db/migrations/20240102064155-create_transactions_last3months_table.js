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
    await queryInterface.sequelize.query('CREATE TABLE IF NOT EXISTS transactions_last_3months LIKE transactions')
    await queryInterface.sequelize.query('ANALYZE TABLE transactions_last_3months')
    await queryInterface.sequelize.query(`
    CREATE TRIGGER insert_transaction_last3months
    AFTER INSERT ON transactions
    FOR EACH ROW
        INSERT INTO transactions_last_3months (id, material_id, customer_id, vendor_id, opening_qty, change_qty, transaction_type_id, transaction_reason_id, created_by, updated_by, createdAt, updatedAt, device_type, entity_id, stock_id, order_id, deleted_at, other_reason, dose_1, dose_2, booster, master_material_id, activity_id, open_vial, close_vial, actual_transaction_date, patient_id, vaccine_sequence)
        VALUES (
            NEW.id,
            NEW.material_id,
            NEW.customer_id,
            NEW.vendor_id,
            NEW.opening_qty,
            NEW.change_qty,
            NEW.transaction_type_id,
            NEW.transaction_reason_id,
            NEW.created_by,
            NEW.updated_by,
            NEW.createdAt,
            NEW.updatedAt,
            NEW.device_type,
            NEW.entity_id,
            NEW.stock_id,
            NEW.order_id,
            NEW.deleted_at,
            NEW.other_reason,
            NEW.dose_1,
            NEW.dose_2,
            NEW.booster,
            NEW.master_material_id,
            NEW.activity_id,
            NEW.open_vial,
            NEW.close_vial,
            NEW.actual_transaction_date,
            NEW.patient_id,
            NEW.vaccine_sequence
        )
    `)
    await queryInterface.sequelize.query(`
    CREATE TRIGGER update_transaction_last3months
    AFTER UPDATE ON transactions
    FOR EACH ROW
        UPDATE transactions_last_3months SET
          material_id = NEW.material_id,
          customer_id = NEW.customer_id,
          vendor_id = NEW.vendor_id,
          opening_qty = NEW.opening_qty,
          change_qty  = NEW.change_qty,
          transaction_type_id = NEW.transaction_type_id,
          transaction_reason_id = NEW.transaction_reason_id,
          created_by  = NEW.created_by,
          updated_by  = NEW.updated_by,
          createdAt = NEW.createdAt,
          updatedAt = NEW.updatedAt,
          device_type = NEW.device_type,
          entity_id = NEW.entity_id,
          stock_id  = NEW.stock_id,
          order_id  = NEW.order_id,
          deleted_at  = NEW.deleted_at,
          other_reason  = NEW.other_reason,
          dose_1  = NEW.dose_1,
          dose_2  = NEW.dose_2,
          booster = NEW.booster,
          master_material_id  = NEW.master_material_id,
          activity_id = NEW.activity_id,
          open_vial = NEW.open_vial,
          close_vial  = NEW.close_vial,
          actual_transaction_date = NEW.actual_transaction_date,
          patient_id  = NEW.patient_id,
          vaccine_sequence = NEW.vaccine_sequence
        WHERE id = NEW.id
    `)
    await queryInterface.sequelize.query(`
      CREATE EVENT IF NOT EXISTS delete_transaction_last3months_everymonth
        ON SCHEDULE EVERY 1 MONTH
      DO
        DELETE FROM transactions_last_3months WHERE createdAt < DATE_SUB(NOW(), INTERVAL 3 MONTH)`)
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query('DROP EVENT IF EXISTS delete_transaction_last3months_everymonth')
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS insert_transaction_last3months')
    await queryInterface.sequelize.query('DROP TRIGGER IF EXISTS update_transaction_last3months')
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS transactions_last_3months')
  }
};
