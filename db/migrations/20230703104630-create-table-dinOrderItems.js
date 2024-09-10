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
    await queryInterface.createTable('din_order_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      din_order_id: { type: Sequelize.INTEGER, allowNull: true },
      produk: { type: Sequelize.STRING(500), allowNull: true },
      kfa_code:{type : Sequelize.STRING, allowNull : true},
      expired_date: {type: Sequelize.DATE, allowNull : true},
      jm_vial: {type: Sequelize.INTEGER, allowNull : true},
      jm_dosis: {type : Sequelize.INTEGER, allowNull : true},
      jm_vial_terima: {type : Sequelize.INTEGER, allowNull : true},
      jm_dosis_terima: {type : Sequelize.INTEGER, allowNull : true},
      entrance_type: {type : Sequelize.STRING, allowNull : true},
      grant_country: {type : Sequelize.STRING, allowNull : true},
      manufacture_country: {type : Sequelize.STRING, allowNull : true},
      no_batch: {type : Sequelize.STRING, allowNull : true},
      released_date: {type: Sequelize.DATE, allowNull : true},
      created_at : {type: Sequelize.DATE, allowNull : false},
      updated_at : {type: Sequelize.DATE, allowNull : false}
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('din_order_items')
  }
};
