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

    /* Provinces */
    const provinces = await queryInterface.describeTable('provinces')

    if (!provinces.province_id_old)
      await queryInterface.addColumn('provinces', 'province_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!provinces.province_id_new)
      await queryInterface.addColumn('provinces', 'province_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    /* Regencies */
    const regencies = await queryInterface.describeTable('regencies')

    if (!regencies.regency_id_old)
      await queryInterface.addColumn('regencies', 'regency_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!regencies.regency_id_new)
      await queryInterface.addColumn('regencies', 'regency_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!regencies.province_id_old)
      await queryInterface.addColumn('regencies', 'province_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!regencies.province_id_new)
      await queryInterface.addColumn('regencies', 'province_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    /* Sub District */
    const subDistricts = await queryInterface.describeTable('sub_districts')

    if (!subDistricts.sub_district_id_old)
      await queryInterface.addColumn('sub_districts', 'sub_district_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!subDistricts.sub_district_id_new)
      await queryInterface.addColumn('sub_districts', 'sub_district_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!subDistricts.regency_id_old)
      await queryInterface.addColumn('sub_districts', 'regency_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!subDistricts.regency_id_new)
      await queryInterface.addColumn('sub_districts', 'regency_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    /* Village */
    const villages = await queryInterface.describeTable('villages')

    if (!villages.village_id_old)
      await queryInterface.addColumn('villages', 'village_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!villages.village_id_new)
      await queryInterface.addColumn('villages', 'village_id_new', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!villages.sub_district_id_old)
      await queryInterface.addColumn('villages', 'sub_district_id_old', {
        allowNull: true,
        type: Sequelize.STRING,
      })

    if (!villages.sub_district_id_new)
      await queryInterface.addColumn('villages', 'sub_district_id_new', {
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
    await queryInterface.removeColumn('provinces', 'province_id_old')
    await queryInterface.removeColumn('provinces', 'province_id_new')

    await queryInterface.removeColumn('regencies', 'regency_id_old')
    await queryInterface.removeColumn('regencies', 'regency_id_new')
    await queryInterface.removeColumn('regencies', 'province_id_old')
    await queryInterface.removeColumn('regencies', 'province_id_new')

    await queryInterface.removeColumn('sub_districts', 'sub_district_id_old')
    await queryInterface.removeColumn('sub_districts', 'sub_district_id_new')
    await queryInterface.removeColumn('sub_districts', 'regency_id_old')
    await queryInterface.removeColumn('sub_districts', 'regency_id_new')

    await queryInterface.removeColumn('villages', 'village_id_old')
    await queryInterface.removeColumn('villages', 'village_id_new')
    await queryInterface.removeColumn('villages', 'sub_district_id_old')
    await queryInterface.removeColumn('villages', 'sub_district_id_new')
  }
}
