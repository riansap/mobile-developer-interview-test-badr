'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_stocks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      order_item_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'order_items',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      stock_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'stocks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.TINYINT
      },
      allocated_qty: {
        type: Sequelize.FLOAT,
      },
      received_qty: {
        type: Sequelize.FLOAT,
      },
      ordered_qty: {
        type: Sequelize.FLOAT,
      },
      created_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      updated_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      deleted_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    /*
    *
    * 'allocated_stock_id',
            'allocated_status',
            'ordered_qty',
            'allocated_qty',
            'received_qty'
            *
            * */
    await queryInterface.addColumn('order_items', 'qty', Sequelize.DOUBLE)
    await queryInterface.removeConstraint('order_items', 'order_items_ibfk_3')
    await queryInterface.removeColumn('order_items', 'allocated_stock_id')
    await queryInterface.removeColumn('order_items', 'allocated_status')
    await queryInterface.removeColumn('order_items', 'ordered_qty')
    await queryInterface.removeColumn('order_items', 'allocated_qty')
    await queryInterface.removeColumn('order_items', 'received_qty')
  },
  down: async (queryInterface, Sequelize) => {
    // add column
    await queryInterface.removeColumn('order_items', 'qty')
    await queryInterface.addColumn('order_items', 'allocated_stock_id', Sequelize.BIGINT)
    await queryInterface.addColumn('order_items', 'allocated_status', Sequelize.TINYINT)
    await queryInterface.addColumn('order_items', 'ordered_qty', Sequelize.DOUBLE)
    await queryInterface.addColumn('order_items', 'allocated_qty', Sequelize.DOUBLE)
    await queryInterface.addColumn('order_items', 'received_qty', Sequelize.DOUBLE)
    await queryInterface.addConstraint('order_items', {
      type: 'foreign key',
      name: 'order_items_ibfk_3',
      fields: ['allocated_stock_id'],
      references: {
        table: 'stocks',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })
    await queryInterface.dropTable('order_stocks')
  }
}