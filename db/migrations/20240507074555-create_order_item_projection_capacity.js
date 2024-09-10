module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_item_projection_capacities', {
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
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      capacity_asset: {
        allowNull: true,
        type: Sequelize.BIGINT
      },
      total_volume: {
        allowNull: true,
        type: Sequelize.BIGINT
      },
      percent_capacity: {
        allowNull: true,
        type: Sequelize.FLOAT
      },
      is_confirm: {
        defaultValue: 0,
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      created_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      updated_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      deleted_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    queryInterface.addIndex('order_item_projection_capacities', ['order_id'])
  },
  down: async (queryInterface, Sequelize) => {
    const foreignKeys = await queryInterface.getForeignKeysForTables(['order_item_projection_capacities'])
    // Remove each foreign key constraint
    for (const foreignKey of foreignKeys['order_item_projection_capacities']) {
      await queryInterface.removeConstraint('order_item_projection_capacities', foreignKey)
    }
    await queryInterface.removeIndex('order_item_projection_capacities', ['order_id'])
    await queryInterface.dropTable('order_item_projection_capacities')
  },
}
