'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('integration_emonev_provinces', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      province_id: { type: Sequelize.INTEGER, allowNull: false },
      trader_id: { type: Sequelize.STRING, allowNull: true, unique: true },
      code: { type: Sequelize.STRING, allowNull: true },
      name: { type: Sequelize.STRING, allowNull: true },
      npwp: { type: Sequelize.STRING, allowNull: true },
      permit: { type: Sequelize.STRING, allowNull: true },
      permit_date: { type: Sequelize.DATEONLY, allowNull: true },
      pic: { type: Sequelize.STRING, allowNull: true },
      pic_email: { type: Sequelize.STRING, allowNull: true },
      pic_phone: { type: Sequelize.STRING, allowNull: true },
      pimpinan: { type: Sequelize.STRING, allowNull: true },
      pimpinan_phone: { type: Sequelize.STRING, allowNull: true },
      pimpinan_email: { type: Sequelize.STRING, allowNull: true },
      
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: true, type: Sequelize.DATE },
      deletedAt: { allowNull: true, type: Sequelize.DATE }
    })
    await queryInterface.createTable('integration_emonev_regencies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      regency_id: { type: Sequelize.INTEGER, allowNull: true },
      trader_id: { type: Sequelize.STRING, allowNull: true, unique: true },
      code: { type: Sequelize.STRING, allowNull: true },
      name: { type: Sequelize.STRING, allowNull: true },
      npwp: { type: Sequelize.STRING, allowNull: true },
      permit: { type: Sequelize.STRING, allowNull: true },
      permit_date: { type: Sequelize.DATEONLY, allowNull: true },
      pic: { type: Sequelize.STRING, allowNull: true },
      pic_email: { type: Sequelize.STRING, allowNull: true },
      pic_phone: { type: Sequelize.STRING, allowNull: true },
      pimpinan: { type: Sequelize.STRING, allowNull: true },
      pimpinan_phone: { type: Sequelize.STRING, allowNull: true },
      pimpinan_email: { type: Sequelize.STRING, allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: true, type: Sequelize.DATE },
      deletedAt: { allowNull: true, type: Sequelize.DATE }
    })
    await queryInterface.createTable('integration_emonev_materials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      master_material_id: { type: Sequelize.INTEGER, allowNull: true },
      tahun: { type: Sequelize.INTEGER, allowNull: true },
      nama_xls: { type: Sequelize.STRING, allowNull: true },
      type_rop: { type: Sequelize.STRING, allowNull: true },
      obat_id: { type: Sequelize.STRING, allowNull: true, unique: true },
      uraian: { type: Sequelize.STRING, allowNull: true },

      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: true, type: Sequelize.DATE },
      deletedAt: { allowNull: true, type: Sequelize.DATE }
    })
    await queryInterface.addIndex('integration_emonev_provinces', ['province_id'])
    await queryInterface.addIndex('integration_emonev_regencies', ['regency_id'])
    await queryInterface.addIndex('integration_emonev_materials', ['master_material_id'])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('integration_emonev_provinces')
     await queryInterface.dropTable('integration_emonev_regencies')
     await queryInterface.dropTable('integration_emonev_materials')
  }
};
