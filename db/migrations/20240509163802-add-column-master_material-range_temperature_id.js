'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const masterMaterial = await queryInterface.describeTable('master_materials')
    if (!masterMaterial.range_temperature_id)
      await queryInterface.addColumn('master_materials', 'range_temperature_id', {
        allowNull: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'range_temperature',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
  },

  async down (queryInterface) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('master_materials', 'range_temperature_id')
  }
}
