'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const dinOrder = await queryInterface.describeTable('din_orders');

    if (!dinOrder.line)
      await queryInterface.addColumn('din_orders', 'line', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.sumber_dana)
      await queryInterface.addColumn('din_orders', 'sumber_dana', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrder.biaya_transport)
      await queryInterface.addColumn('din_orders', 'biaya_transport', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrder.total_transaksi)
      await queryInterface.addColumn('din_orders', 'total_transaksi', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrder.jenis_layanan)
      await queryInterface.addColumn('din_orders', 'jenis_layanan', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.alamat_pengirim)
      await queryInterface.addColumn('din_orders', 'alamat_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kodepos_pengirim)
      await queryInterface.addColumn('din_orders', 'kodepos_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.provinsi_pengirim)
      await queryInterface.addColumn('din_orders', 'provinsi_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.provinsi_id_pengirim)
      await queryInterface.addColumn('din_orders', 'provinsi_id_pengirim', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrder.kabkota_pengirim)
      await queryInterface.addColumn('din_orders', 'kabkota_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kabkota_id_pengirim)
      await queryInterface.addColumn('din_orders', 'kabkota_id_pengirim', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrder.kecamatan_pengirim)
      await queryInterface.addColumn('din_orders', 'kecamatan_pengirim', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kecamatan_id_pengirim)
      await queryInterface.addColumn('din_orders', 'kecamatan_id_pengirim', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    /* penerima */

    if (!dinOrder.alamat_penerima)
      await queryInterface.addColumn('din_orders', 'alamat_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kodepos_penerima)
      await queryInterface.addColumn('din_orders', 'kodepos_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.provinsi_penerima)
      await queryInterface.addColumn('din_orders', 'provinsi_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.provinsi_id_penerima)
      await queryInterface.addColumn('din_orders', 'provinsi_id_penerima', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrder.kabkota_penerima)
      await queryInterface.addColumn('din_orders', 'kabkota_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kabkota_id_penerima)
      await queryInterface.addColumn('din_orders', 'kabkota_id_penerima', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if (!dinOrder.kecamatan_penerima)
      await queryInterface.addColumn('din_orders', 'kecamatan_penerima', {
        allowNull: true,
        type: Sequelize.STRING
      })

    if (!dinOrder.kecamatan_id_penerima)
      await queryInterface.addColumn('din_orders', 'kecamatan_id_penerima', {
        allowNull: true,
        type: Sequelize.INTEGER
      })

    if(dinOrder.produk)
      await queryInterface.removeColumn('din_orders', 'produk')
    if(dinOrder.no_batch)
      await queryInterface.removeColumn('din_orders', 'no_batch')
    if(dinOrder.expired_date)
      await queryInterface.removeColumn('din_orders', 'expired_date')
    if(dinOrder.jm_vial)
      await queryInterface.removeColumn('din_orders', 'jm_vial')
    if(dinOrder.jm_dosis)
      await queryInterface.removeColumn('din_orders', 'jm_dosis')
    if(dinOrder.jm_vial_terima)
      await queryInterface.removeColumn('din_orders', 'jm_vial_terima')
    if(dinOrder.jm_dosis_terima)
      await queryInterface.removeColumn('din_orders', 'jm_dosis_terima')
    if(dinOrder.released_date)
      await queryInterface.removeColumn('din_orders', 'released_date')
    if(dinOrder.kfa_code)
      await queryInterface.removeColumn('din_orders', 'kfa_code')
    if(dinOrder.entrance_type)
      await queryInterface.removeColumn('din_orders', 'entrance_type')
    if(dinOrder.grant_country)
      await queryInterface.removeColumn('din_orders', 'grant_country')
    if(dinOrder.manufacture_country)
      await queryInterface.removeColumn('din_orders', 'manufacture_country')

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('din_orders', 'line')
    await queryInterface.removeColumn('din_orders', 'sumber_dana')
    await queryInterface.removeColumn('din_orders', 'biaya_transport')
    await queryInterface.removeColumn('din_orders', 'total_transaksi')
    await queryInterface.removeColumn('din_orders', 'jenis_layanan')
    await queryInterface.removeColumn('din_orders', 'alamat_pengirim')
    await queryInterface.removeColumn('din_orders', 'kodepos_pengirim')
    await queryInterface.removeColumn('din_orders', 'provinsi_pengirim')
    await queryInterface.removeColumn('din_orders', 'provinsi_id_pengirim')
    await queryInterface.removeColumn('din_orders', 'kabkota_pengirim')
    await queryInterface.removeColumn('din_orders', 'kabkota_id_pengirim')
    await queryInterface.removeColumn('din_orders', 'kecamatan_pengirim')
    await queryInterface.removeColumn('din_orders', 'kecamatan_id_pengirim')

    await queryInterface.removeColumn('din_orders', 'alamat_penerima')
    await queryInterface.removeColumn('din_orders', 'kodepos_penerima')
    await queryInterface.removeColumn('din_orders', 'provinsi_penerima')
    await queryInterface.removeColumn('din_orders', 'provinsi_id_penerima')
    await queryInterface.removeColumn('din_orders', 'kabkota_penerima')
    await queryInterface.removeColumn('din_orders', 'kabkota_id_penerima')
    await queryInterface.removeColumn('din_orders', 'kecamatan_penerima')
    await queryInterface.removeColumn('din_orders', 'kecamatan_id_penerima')
  }
};
