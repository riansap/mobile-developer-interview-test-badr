'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('order_stock_purchase', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      order_stock_id: { type: Sequelize.INTEGER, allowNull: true },
      source_material_id: { type: Sequelize.INTEGER, allowNull: true },
      year:{type : Sequelize.INTEGER, allowNull : true},
      price: {type: Sequelize.INTEGER, allowNull : true},
      pieces_purchase_id: {type: Sequelize.INTEGER, allowNull : true},
      created_at : {type: Sequelize.DATE, allowNull : false},
      updated_at : {type: Sequelize.DATE, allowNull : false},
      deleted_at : {type : Sequelize.DATE, allowNull : true}
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('order_stock_purchase')
  }
};
