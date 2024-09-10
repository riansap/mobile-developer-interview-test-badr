'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('entity_has_master_materials', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      entity_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'entities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      master_material_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'master_materials',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      min: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      max: {
        allowNull: false,
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      on_hand_stock: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      allocated_stock: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      stock_last_update: {
        type: Sequelize.DATE,
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
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('entity_has_master_materials');
  }
};
