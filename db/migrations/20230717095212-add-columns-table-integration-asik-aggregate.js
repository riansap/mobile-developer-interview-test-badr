"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const asikAggregate = await queryInterface.describeTable('integration_asik_aggregate');

    if (!asikAggregate.pos_imunisasi_asik_province_id)
      await queryInterface.addColumn('integration_asik_aggregate', 'pos_imunisasi_asik_province_id', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!asikAggregate.pos_imunisasi_asik_regency_id)
      await queryInterface.addColumn('integration_asik_aggregate', 'pos_imunisasi_asik_regency_id', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!asikAggregate.pos_imunisasi_asik_subdistrict_id)
      await queryInterface.addColumn('integration_asik_aggregate', 'pos_imunisasi_asik_subdistrict_id', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!asikAggregate.puskesmas_asik_province_id)
      await queryInterface.addColumn('integration_asik_aggregate', 'puskesmas_asik_province_id', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!asikAggregate.puskesmas_asik_regency_id)
      await queryInterface.addColumn('integration_asik_aggregate', 'puskesmas_asik_regency_id', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!asikAggregate.puskesmas_asik_subdistrict_id)
      await queryInterface.addColumn('integration_asik_aggregate', 'puskesmas_asik_subdistrict_id', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!asikAggregate.page)
      await queryInterface.addColumn('integration_asik_aggregate', 'page', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("integration_asik_aggregate", "pos_imunisasi_asik_province_id");
    await queryInterface.removeColumn("integration_asik_aggregate", "pos_imunisasi_asik_regency_id");
    await queryInterface.removeColumn("integration_asik_aggregate", "pos_imunisasi_asik_subdistrict_id");

    await queryInterface.removeColumn("integration_asik_aggregate", "puskesmas_asik_province_id");
    await queryInterface.removeColumn("integration_asik_aggregate", "puskesmas_asik_regency_id");
    await queryInterface.removeColumn("integration_asik_aggregate", "puskesmas_asik_subdistrict_id");
    await queryInterface.removeColumn("integration_asik_aggregate", "page");
  },
};
