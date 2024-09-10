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


    await queryInterface.createTable('order_items_kfa', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      order_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'orders',
          key: 'id',
        }
      },
      code_kfa_product_template : {
        allowNull: true,
        type: Sequelize.STRING(20)
      },
      qty: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      recomended_stock: {
        allowNull: true,
        type: Sequelize.DOUBLE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    })

  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('order_items_kfa')
  }
};
