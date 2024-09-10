module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('new_opname_stocks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      new_opname_item_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'new_opname_items',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      stock_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'stocks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      batch_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'batches',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      batch_code: {
        type: Sequelize.STRING,
      },
      expired_date: {
        type: Sequelize.DATE,
      },
      smile_qty: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      real_qty: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      unsubmit_distribution_qty: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      unsubmit_return_qty: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('new_opname_stocks')
  },
}
