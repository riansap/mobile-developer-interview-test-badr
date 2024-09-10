'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('entity_master_material_minmax', {
      id: {
        type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true,
      }, emma_id: {
        type: Sequelize.INTEGER, allowNull: false, references: {
          model: 'entity_master_material_activities', key: 'id',
        },
      }, yearly_plan_id: {
        type: Sequelize.BIGINT, allowNull: false, references: {
          model: 'yearly_plans', key: 'id',
        },
      }, min: {
        type: Sequelize.INTEGER, allowNull: false,
      }, max: {
        type: Sequelize.INTEGER, allowNull: false,
      }, created_at: {
        type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, updated_at: {
        type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }, deleted_at: {
        type: Sequelize.DATE, allowNull: true,
      }, created_by: {
        type: Sequelize.INTEGER, allowNull: false,
      }, updated_by: {
        type: Sequelize.INTEGER, allowNull: false,
      },
    }).catch((err) => {
      console.log(err)
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('entity_master_material_minmax')
  },
}
