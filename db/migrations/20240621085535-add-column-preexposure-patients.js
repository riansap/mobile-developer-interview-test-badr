'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const patient = await queryInterface.describeTable('patients')

    if (!patient.preexposure_sequence)
      await queryInterface.addColumn('patients', 'preexposure_sequence', {
        allowNull: true,
        type: Sequelize.TINYINT
      })

    if (!patient.last_preexposure_at)
      await queryInterface.addColumn('patients', 'last_preexposure_at', {
        allowNull: true,
        type: Sequelize.DATE
      })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('patients', 'preexposure_sequence')
    await queryInterface.removeColumn('patients', 'last_preexposure_at')
  }
}
