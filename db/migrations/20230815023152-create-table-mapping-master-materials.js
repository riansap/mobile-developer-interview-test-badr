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
    await queryInterface.createTable('mapping_master_materials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      id_material_smile : {type: Sequelize.INTEGER, allowNull : true},
      code_kfa_ingredients: { type: Sequelize.INTEGER, allowNull: true },
      code_kfa_product_template: { type: Sequelize.INTEGER, allowNull: true },
      code_kfa_product_variant:{type : Sequelize.INTEGER, allowNull : true},
      code_kfa_packaging: {type: Sequelize.INTEGER, allowNull : true},
      id_kfa: {type: Sequelize.INTEGER, allowNull : true},
      code_biofarma: {type : Sequelize.STRING, allowNull : true},
      created_at : {type: Sequelize.DATE, allowNull : false},
      updated_at : {type: Sequelize.DATE, allowNull : false},
      deleted_at : {type : Sequelize.DATE, allowNull : true}
    })
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('mapping_master_materials')
  }
};
