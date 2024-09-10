'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('manufactures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      reference_id: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      contact_name: {
        type: Sequelize.STRING
      },
      phone_number: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.TEXT
      },
      village_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'villages',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      created_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      deleted_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      deleted_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
    await queryInterface.addColumn('batches', 'manufacture_id', {
      type: Sequelize.INTEGER
    })
    await queryInterface.addConstraint('batches', {
      type: 'foreign key',
      name: 'batches_ibfk_1',
      fields: ['manufacture_id'],
      references: {
        table: 'manufactures',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('batches', 'batches_ibfk_1')
    await queryInterface.removeColumn('batches', 'manufacture_id')
    await queryInterface.dropTable('manufactures')
  }
}
