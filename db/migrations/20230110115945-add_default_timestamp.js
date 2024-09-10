'use strict'

/** @type {import('sequelize-cli').Migration} */
const excludeTables = ['SequelizeMeta', 'sequelizemeta']

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const tableNames = await queryInterface.showAllTables()
    for(const table of tableNames){
      if(!excludeTables.includes(table)){
        const tableColumns = await queryInterface.describeTable(table)
        console.log(table)

        if (tableColumns.created_at) {
          await queryInterface.changeColumn(table, 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
        } else if (tableColumns.createdAt) {
          await queryInterface.changeColumn(table, 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
        } else {
          await queryInterface.addColumn(table, 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
        }
        if (tableColumns.updated_at) {
          await queryInterface.changeColumn(table, 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
        } else if (tableColumns.updatedAt) {
          await queryInterface.changeColumn(table, 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
        } else {
          await queryInterface.addColumn(table, 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
        }
      }
    }
    // await queryInterface.changeColumn('batches', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('batches', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('biofarma_orders', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('biofarma_orders', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entities', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entities', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entity_has_master_materials', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entity_has_master_materials', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entity_master_material_activities', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entity_master_material_activities', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entity_tags', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('entity_tags', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_child_reasons', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_child_reasons', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_comments', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_comments', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_histories', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_histories', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_items', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_items', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_reasons', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_report_reasons', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_reports', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('event_reports', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_flow_reasons', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_flow_reasons', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_flows', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_flows', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_transaction_types', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_transaction_types', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_transactions', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('extermination_transactions', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_ayo_sehat', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_ayo_sehat', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_emonev_materials', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_emonev_materials', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_emonev_provinces', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_emonev_provinces', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_emonev_regencies', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('integration_emonev_regencies', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('manufactures', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('manufactures', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_activities', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_activities', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_ipvs', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_ipvs', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_material_has_conditions', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_material_has_conditions', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_materials', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_materials', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_target', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_target', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_target_distributions', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_target_distributions', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_target_regencies', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('master_target_regencies', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_conditions', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_conditions', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_entity', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_entity', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_manufacture', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_manufacture', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_material_tag', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_material_tag', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_tags', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('material_tags', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('materials', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('materials', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('materialss', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('materialss', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('new_opname_items', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('new_opname_items', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('new_opname_stocks', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('new_opname_stocks', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('new_opnames', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('new_opnames', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_actions', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_actions', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_item_reason_actions', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_item_reason_actions', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_reasons', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_reasons', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_stock_items', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_stock_items', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_stocks', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('opname_stocks', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('order_comments', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('order_comments', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('transactions', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('transactions', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('stocks', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('stocks', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('stock_exterminations', 'createdAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('stock_exterminations', 'updatedAt', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('orders', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('orders', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('stock_intervals', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('stock_intervals', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('users', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.changeColumn('users', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('customer_vendors', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('customer_vendors', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('login_attempts', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('login_attempts', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('master_material_has_activities', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('master_material_has_activities', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('master_material_has_companions', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('master_material_has_companions', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('master_material_has_manufactures', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('master_material_has_manufactures', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('material_companions', 'created_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP()')})
    // await queryInterface.addColumn('material_companions', 'updated_at', {allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP()')})
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // await queryInterface.removeColumn('customer_vendors', 'created_at')
    // await queryInterface.removeColumn('customer_vendors', 'updated_at')
    // await queryInterface.removeColumn('login_attempts', 'created_at')
    // await queryInterface.removeColumn('login_attempts', 'updated_at')
    // await queryInterface.removeColumn('master_material_has_activities', 'created_at')
    // await queryInterface.removeColumn('master_material_has_activities', 'updated_at')
    // await queryInterface.removeColumn('master_material_has_companions', 'created_at')
    // await queryInterface.removeColumn('master_material_has_companions', 'updated_at')
    // await queryInterface.removeColumn('master_material_has_manufactures', 'created_at')
    // await queryInterface.removeColumn('master_material_has_manufactures', 'updated_at')
    // await queryInterface.removeColumn('material_companions', 'created_at')
    // await queryInterface.removeColumn('material_companions', 'updated_at')
  }
}
