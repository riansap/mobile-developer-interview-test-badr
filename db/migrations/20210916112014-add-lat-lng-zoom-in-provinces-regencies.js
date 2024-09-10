'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('provinces', 'lat', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'name'
    })

    await queryInterface.addColumn('provinces', 'lng', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'lat'
    })

    await queryInterface.addColumn('provinces', 'zoom', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'lng'
    })


    await queryInterface.addColumn('regencies', 'lat', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'name'
    })

    await queryInterface.addColumn('regencies', 'lng', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      after: 'lat'
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('provinces', 'lat')
    await queryInterface.removeColumn('provinces', 'lng')
    await queryInterface.removeColumn('provinces', 'zoom')
    await queryInterface.removeColumn('regencies', 'lat')
    await queryInterface.removeColumn('regencies', 'lng')
  }
}
