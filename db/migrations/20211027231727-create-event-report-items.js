module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('event_report_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      event_report_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'event_reports',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      material_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'materials',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      no_batch: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      expired_date: {
        type: Sequelize.DATE,
      },
      production_date: {
        type: Sequelize.DATE,
      },
      qty: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      reason_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'event_report_reasons',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      child_reason_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'event_report_child_reasons',
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
    queryInterface.addIndex('event_report_items', ['no_batch'])
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_report_items')
  },
}
