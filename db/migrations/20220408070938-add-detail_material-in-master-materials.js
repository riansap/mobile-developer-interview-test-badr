'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('master_materials', 'pieces_per_unit', {
      allowNull: false,
      type: Sequelize.DOUBLE,
      defaultValue: 1
    })
    await queryInterface.addColumn('master_materials', 'unit', {
      type: Sequelize.STRING,
    })
    await queryInterface.addColumn('master_materials', 'temperature_sensitive', {
      type: Sequelize.TINYINT,
    })
    await queryInterface.addColumn('master_materials', 'temperature_min', {
      type: Sequelize.DOUBLE,
    })
    await queryInterface.addColumn('master_materials', 'temperature_max', {
      type: Sequelize.DOUBLE,
    })
    await queryInterface.addColumn('master_materials', 'managed_in_batch', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    })
    await queryInterface.addColumn('master_materials', 'status', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    })
    await queryInterface.addColumn('master_materials', 'is_vaccine', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    })
    await queryInterface.addColumn('master_materials', 'is_stockcount', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    })
    await queryInterface.addColumn('master_materials', 'is_addremove', {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    })

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('master_materials', 'pieces_per_unit')
    await queryInterface.removeColumn('master_materials', 'unit')
    await queryInterface.removeColumn('master_materials', 'temperature_sensitive')
    await queryInterface.removeColumn('master_materials', 'temperature_min')
    await queryInterface.removeColumn('master_materials', 'temperature_max')
    await queryInterface.removeColumn('master_materials', 'managed_in_batch')
    await queryInterface.removeColumn('master_materials', 'status')
    await queryInterface.removeColumn('master_materials', 'is_vaccine')
    await queryInterface.removeColumn('master_materials', 'is_stockcount')
    await queryInterface.removeColumn('master_materials', 'is_addremove')
  }
};
