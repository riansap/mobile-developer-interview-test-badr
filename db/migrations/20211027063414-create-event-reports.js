module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('event_reports', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'entities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      order_id: {
        type: Sequelize.BIGINT,
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      no_packing_slip: {
        type: Sequelize.STRING,
      },
      has_order: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      arrived_date: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      created_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      updated_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      finished_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      deleted_by: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    })
    queryInterface.addIndex('event_reports', ['arrived_date'])
    queryInterface.addIndex('event_reports', ['status'])
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_reports')
  },
}
