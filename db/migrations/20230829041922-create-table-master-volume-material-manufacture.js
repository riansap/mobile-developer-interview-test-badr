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
    await queryInterface.createTable('master_volume_material_manufactures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      master_material_id : {type: Sequelize.INTEGER, allowNull : true},
      manufacture_id: { type: Sequelize.INTEGER, allowNull: true },
      pieces_per_unit: { type: Sequelize.DOUBLE, allowNull: true },
      unit_per_box:{type : Sequelize.DOUBLE, allowNull : true},
      box_length: {type: Sequelize.DOUBLE, allowNull : true},
      box_width: {type : Sequelize.DOUBLE, allowNull : true},
      box_height: {type: Sequelize.DOUBLE, allowNull : true},
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
    await queryInterface.dropTable('master_volume_material_manufactures')
  }
};
