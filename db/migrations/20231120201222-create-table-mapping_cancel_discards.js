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
    await queryInterface.createTable('mapping_cancel_discard', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      transaction_discard_id: { type: Sequelize.BIGINT, allowNull: false },
      transaction_cancel_discard_id : {type : Sequelize.BIGINT, allowNull : false},
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
    await queryInterface.dropTable('mapping_cancel_discard')
  }
};
