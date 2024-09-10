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

    const newOpnames = await queryInterface.describeTable('new_opnames');

    if (!newOpnames.period_id)
      await queryInterface.addColumn('new_opnames', 'period_id', {
        allowNull: true,
        type: Sequelize.BIGINT,
        after: 'entity_id'
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('new_opnames', 'period_id')
  }
};
