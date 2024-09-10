'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface
    const t = await sequelize.transaction()
    const options = { transaction: t }
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, options)
      await queryInterface.removeConstraint('entities', 'entities_ibfk_1', options)
      await queryInterface.removeConstraint('users', 'users_ibfk_1', options)
      await queryInterface.removeConstraint('manufactures', 'manufactures_ibfk_1', options)
      await queryInterface.removeConstraint('regencies', 'regencies_ibfk_1', options)
      await queryInterface.removeConstraint('sub_districts', 'sub_districts_ibfk_1', options)
      await queryInterface.removeConstraint('villages', 'villages_ibfk_1', options)

      await queryInterface.changeColumn('villages', 'id', Sequelize.STRING, options)
      await queryInterface.changeColumn('entities', 'village_id', Sequelize.STRING, options)
      await queryInterface.changeColumn('users', 'village_id', Sequelize.STRING, options)
      await queryInterface.changeColumn('manufactures', 'village_id', Sequelize.STRING, options)

      await queryInterface.changeColumn('provinces', 'id', Sequelize.STRING, options)
      await queryInterface.changeColumn('regencies', 'province_id', Sequelize.STRING, options)
      await queryInterface.changeColumn('regencies', 'id', Sequelize.STRING, options)
      await queryInterface.changeColumn('sub_districts', 'regency_id', Sequelize.STRING, options)
      await queryInterface.changeColumn('sub_districts', 'id', Sequelize.STRING, options)
      await queryInterface.changeColumn('villages', 'sub_district_id', Sequelize.STRING, options)

      await queryInterface.addConstraint('entities', {
        type: 'foreign key',
        name: 'entities_ibfk_1',
        fields: ['village_id'],
        references: {
          table: 'villages',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addConstraint('users', {
        type: 'foreign key',
        name: 'users_ibfk_1',
        fields: ['village_id'],
        references: {
          table: 'villages',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
      await queryInterface.addConstraint('manufactures', {
        type: 'foreign key',
        name: 'manufactures_ibfk_1',
        fields: ['village_id'],
        references: {
          table: 'villages',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addConstraint('regencies', {
        type: 'foreign key',
        name: 'regencies_ibfk_1',
        fields: ['province_id'],
        references: {
          table: 'provinces',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addConstraint('sub_districts', {
        type: 'foreign key',
        name: 'sub_districts_ibfk_1',
        fields: ['regency_id'],
        references: {
          table: 'regencies',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addConstraint('villages', {
        type: 'foreign key',
        name: 'villages_ibfk_1',
        fields: ['sub_district_id'],
        references: {
          table: 'sub_districts',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, options)

      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
  },
  down: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface
    const t = await sequelize.transaction()
    const options = { transaction: t }

    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, options)
      await queryInterface.removeConstraint('entities', 'entities_ibfk_1', options)
      await queryInterface.removeConstraint('users', 'users_ibfk_1', options)
      await queryInterface.removeConstraint('manufactures', 'manufactures_ibfk_1', options)
      await queryInterface.removeConstraint('regencies', 'regencies_ibfk_1', options)
      await queryInterface.removeConstraint('sub_districts', 'sub_districts_ibfk_1', options)
      await queryInterface.removeConstraint('villages', 'villages_ibfk_1', options)

      await queryInterface.changeColumn('villages', 'id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('entities', 'village_id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('users', 'village_id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('manufactures', 'village_id', Sequelize.INTEGER, options)

      await queryInterface.changeColumn('provinces', 'id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('regencies', 'province_id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('regencies', 'id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('sub_districts', 'id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('sub_districts', 'regency_id', Sequelize.INTEGER, options)
      await queryInterface.changeColumn('villages', 'sub_district_id', Sequelize.INTEGER, options)

      await queryInterface.addConstraint('entities', {
        type: 'foreign key',
        name: 'entities_ibfk_1',
        fields: ['village_id'],
        references: {
          table: 'villages',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addConstraint('users', {
        type: 'foreign key',
        name: 'users_ibfk_1',
        fields: ['village_id'],
        references: {
          table: 'villages',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
      await queryInterface.addConstraint('manufactures', {
        type: 'foreign key',
        name: 'manufactures_ibfk_1',
        fields: ['village_id'],
        references: {
          table: 'villages',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      })
      await queryInterface.addConstraint('regencies', {
        type: 'foreign key',
        name: 'regencies_ibfk_1',
        fields: ['province_id'],
        references: {
          table: 'provinces',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addConstraint('sub_districts', {
        type: 'foreign key',
        name: 'sub_districts_ibfk_1',
        fields: ['regency_id'],
        references: {
          table: 'regencies',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await queryInterface.addConstraint('villages', {
        type: 'foreign key',
        name: 'villages_ibfk_1',
        fields: ['sub_district_id'],
        references: {
          table: 'sub_districts',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, options)
      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
  }
}
