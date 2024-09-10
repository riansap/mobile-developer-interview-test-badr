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

    
    queryInterface.sequelize.query(`
    CREATE EVENT IF NOT EXISTS Delete_Log_Coldstorage_Older_Than_14_Days
      ON SCHEDULE EVERY 1 DAY
      STARTS STR_TO_DATE(DATE_FORMAT(NOW(),'%Y%m%d 0100'),'%Y%m%d %H%i') + INTERVAL 1 DAY
    DO
      DELETE FROM coldstorage_transaction_logs WHERE created_at < DATE_SUB(NOW(),INTERVAL 14 DAY)`)
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    queryInterface.sequelize.query('DROP EVENT IF EXISTS Delete_Log_Coldstorage_Older_Than_14_Days')
  }
};
