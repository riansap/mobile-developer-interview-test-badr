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
    await queryInterface.createTable('integration_asik_aggregate', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      customer_id: { type: Sequelize.INTEGER, allowNull: true },
      pos_imunisasi_asik: { type: Sequelize.STRING, allowNull: true },
      vendor_id: { type: Sequelize.INTEGER, allowNull: true },
      puskesmas_asik: { type: Sequelize.STRING, allowNull: true },
      master_material_id: { type: Sequelize.INTEGER, allowNull: true },
      vaksin_asik: { type: Sequelize.STRING, allowNull: true },
      batch_number_asik : {type : Sequelize.STRING, allowNull : true},
      batch_id_smile : {type : Sequelize.INTEGER, allowNull : true},
      batch_code_smile : {type : Sequelize.STRING, allowNull : true},
      injection_date : {type : Sequelize.DATEONLY, allowNull : true},
      aggregate : {type : Sequelize.INTEGER, allowNull :true},
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: true, type: Sequelize.DATE },
      deletedAt: { allowNull: true, type: Sequelize.DATE },
      input_date : {type : Sequelize.DATEONLY, allowNull : true}
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('integration_asik_aggregate')
  }
};
