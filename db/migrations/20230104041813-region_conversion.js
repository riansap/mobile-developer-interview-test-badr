'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     */
    await queryInterface.createTable('region_conversion_province', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bps_code: { type: Sequelize.STRING, },
      bps_name: { type: Sequelize.STRING, },
      kemendagri_code: { type: Sequelize.STRING, },
      kemendagri_name: { type: Sequelize.STRING, },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW'), },
      updated_at: { type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    })
    await queryInterface.createTable('region_conversion_regencies', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bps_code: { type: Sequelize.STRING, },
      bps_name: { type: Sequelize.STRING, },
      kemendagri_code: { type: Sequelize.STRING, },
      kemendagri_name: { type: Sequelize.STRING, },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW'), },
      updated_at: { type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    })
    await queryInterface.createTable('region_conversion_subdistricts', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bps_code: { type: Sequelize.STRING, },
      bps_name: { type: Sequelize.STRING, },
      kemendagri_code: { type: Sequelize.STRING, },
      kemendagri_name: { type: Sequelize.STRING, },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW'), },
      updated_at: { type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    })
    await queryInterface.createTable('region_conversion_villages', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bps_code: { type: Sequelize.STRING, },
      bps_name: { type: Sequelize.STRING, },
      kemendagri_code: { type: Sequelize.STRING, },
      kemendagri_name: { type: Sequelize.STRING, },
      created_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW'), },
      updated_at: { type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     */
    await queryInterface.dropTable('region_conversion_province')
    await queryInterface.dropTable('region_conversion_regencies')
    await queryInterface.dropTable('region_conversion_subdistricts')
    await queryInterface.dropTable('region_conversion_villages')
  }
}
