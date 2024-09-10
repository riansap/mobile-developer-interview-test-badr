module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('new_opname_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      new_opname_id: {
        allowNull: false,
        type: Sequelize.BIGINT,
        references: {
          model: 'new_opnames',
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
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('new_opname_items')
  },
}
