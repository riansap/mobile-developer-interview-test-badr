module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('range_temperature', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      temperature_min: {
        allowNull: false,
        type: Sequelize.DOUBLE
      },
      temperature_max: {
        allowNull: false,
        type: Sequelize.DOUBLE
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

    await queryInterface.bulkInsert('range_temperature', [
      {
        id: 1,
        temperature_min: 2,
        temperature_max: 8,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        temperature_min: -25,
        temperature_max: -15,
        created_at: new Date(),
        updated_at: new Date()
      },
    ]).catch((err) => {
      console.log(err)
    })
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('range_temperature')
  },
}
