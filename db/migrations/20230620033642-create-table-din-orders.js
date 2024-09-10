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
    await queryInterface.createTable('din_orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      biofarma_id: { type: Sequelize.INTEGER, allowNull: true },
      no_do: { type: Sequelize.STRING, allowNull: true },
      tanggal_do: { type: Sequelize.DATE, allowNull: true },
      no_po: { type: Sequelize.STRING, allowNull: true },
      kode_area: { type: Sequelize.INTEGER, allowNull: true },
      pengirim: { type: Sequelize.STRING, allowNull: true },
      tujuan : {type : Sequelize.STRING, allowNull : true},
      alamat : {type : Sequelize.STRING, allowNull : true},
      produk : {type : Sequelize.STRING(500), allowNull : true},
      no_batch : {type : Sequelize.STRING, allowNull : true},
      expired_date : {type : Sequelize.DATE, allowNull :true},
      jm_vial: {  allowNull: true, type: Sequelize.INTEGER },
      jm_dosis: { allowNull: true, type: Sequelize.INTEGER },
      status: { allowNull: true, type: Sequelize.STRING },
      tanggal_terima : {type : Sequelize.DATE, allowNull : true},
      created_at : {type: Sequelize.DATE, allowNull : false},
      updated_at : {type: Sequelize.DATE, allowNull : false},
      exist_smile : {type : Sequelize.INTEGER, allowNull : true},
      jm_vial_terima : {type : Sequelize.INTEGER, allowNull : true},
      jm_dosis_terima : {type : Sequelize.INTEGER, allowNull : true},
      tanggal_kirim : {type : Sequelize.DATE, allowNull : true},
      biofarma_type : {type : Sequelize.STRING, allowNull : true},
      service_type : {type : Sequelize.STRING, allowNull : true},
      no_document : {type : Sequelize.STRING, allowNull : true},
      released_date : {type : Sequelize.DATE, allowNull : true},
      notes : {type : Sequelize.TEXT, allowNull : true},
      kfa_code: {type : Sequelize.STRING, allowNull : true},
      entrance_type : {type : Sequelize.STRING, allowNull : true},
      grant_country: {type : Sequelize.STRING, allowNull : true},
      manufacture_country: {type : Sequelize.STRING, allowNull : true}
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('din_orders')
  }
};
