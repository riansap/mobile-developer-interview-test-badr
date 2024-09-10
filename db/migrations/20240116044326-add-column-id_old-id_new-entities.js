'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const entities = await queryInterface.describeTable('entities')

    if (!entities.code_old)
      await queryInterface.addColumn('entities', 'code_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!entities.code_new)
      await queryInterface.addColumn('entities', 'code_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!entities.province_id_old)
      await queryInterface.addColumn('entities', 'province_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!entities.province_id_new)
      await queryInterface.addColumn('entities', 'province_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!entities.regency_id_old)
      await queryInterface.addColumn('entities', 'regency_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!entities.regency_id_new)
      await queryInterface.addColumn('entities', 'regency_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!entities.sub_district_id_old)
      await queryInterface.addColumn('entities', 'sub_district_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!entities.sub_district_id_new)
      await queryInterface.addColumn('entities', 'sub_district_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!entities.village_id_old)
      await queryInterface.addColumn('entities', 'village_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!entities.village_id_new)
      await queryInterface.addColumn('entities', 'village_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('entities', 'province_id_old')
    await queryInterface.removeColumn('entities', 'province_id_new')
    await queryInterface.removeColumn('entities', 'regency_id_old')
    await queryInterface.removeColumn('entities', 'regency_id_new')
    await queryInterface.removeColumn('entities', 'sub_district_id_old')
    await queryInterface.removeColumn('entities', 'sub_district_id_new')
    await queryInterface.removeColumn('entities', 'village_id_old')
    await queryInterface.removeColumn('entities', 'village_id_new')
  }
}
