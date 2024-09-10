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
    const transaction = await queryInterface.describeTable('transactions');

    const options = { transaction: transaction }
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, options)

    if (!transaction.vaccine_sequence)
      await queryInterface.addColumn('transactions', 'vaccine_sequence', {
        allowNull: true,
        type: Sequelize.TINYINT
      })

    await queryInterface.changeColumn('transactions', 'patient_id', {
      type : Sequelize.BIGINT,
      allowNull : true,
    })
    await queryInterface.changeColumn('transactions', 'patient_id', {
      references : {
        model: 'patients', key: 'id',
      }
    })
    await queryInterface.addColumn('transactions_last_3months', 'vaccine_sequence', {
      allowNull: true,
      type: Sequelize.TINYINT
    })

    await queryInterface.changeColumn('transactions_last_3months', 'patient_id', {
      type : Sequelize.BIGINT,
      allowNull : true,
    })
    await queryInterface.changeColumn('transactions_last_3months', 'patient_id', {
      references : {
        model: 'patients', key: 'id',
      }
    })
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, options)
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('transactions', 'vaccine_sequence')
    await queryInterface.removeColumn('transactions_last_3months', 'vaccine_sequence')
  }
};
