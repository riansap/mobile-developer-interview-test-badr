-- Create the trigger
DELIMITER //
CREATE TRIGGER insert_transaction_last3months
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    -- Insert the new row into tableB
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
    );
    -- Add more columns as needed

END;
//
DELIMITER ;
