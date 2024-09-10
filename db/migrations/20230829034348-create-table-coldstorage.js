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
    await queryInterface.createTable('coldstorages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      entity_id : {type: Sequelize.INTEGER, allowNull : true},
      volume_asset: { type: Sequelize.DOUBLE, allowNull: true },
      total_volume:{type : Sequelize.DOUBLE, allowNull : true},
      percentage_capacity: {type: Sequelize.DOUBLE, allowNull : true},
      created_at : {type: Sequelize.DATE, allowNull : false},
      updated_at : {type: Sequelize.DATE, allowNull : false},
      deleted_at : {type : Sequelize.DATE, allowNull : true}
    })

    await queryInterface.createTable('coldstorage_materials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      coldstorage_id : {type : Sequelize.INTEGER, allowNull : true},
      entity_id : {type: Sequelize.INTEGER, allowNull : true},
      master_material_id: { type: Sequelize.INTEGER, allowNull: true },
      dosage_stock: { type: Sequelize.DOUBLE, allowNull: true },
      vial_stock:{type : Sequelize.DOUBLE, allowNull : true},
      package_stock: {type: Sequelize.DOUBLE, allowNull : true},
      package_volume: {type : Sequelize.DOUBLE, allowNull : true},
      remain_package_fulfill : {type: Sequelize.DOUBLE, allowNull: true},
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
    await queryInterface.dropTable('coldstorages')
    await queryInterface.dropTable('coldstorage_materials')
  }
};
