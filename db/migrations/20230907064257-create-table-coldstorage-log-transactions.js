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
    await queryInterface.createTable('coldstorage_transaction_logs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      entity_id: { type: Sequelize.INTEGER, allowNull: true },
      master_material_id : {type: Sequelize.INTEGER, allowNull : true},
      status : {type : Sequelize.TINYINT, allowNull : true},
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
    await queryInterface.dropTable('coldstorage_transaction_logs')
  }
};
