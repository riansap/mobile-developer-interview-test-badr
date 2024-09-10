'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class KfaLevel extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  KfaLevel.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      code: {
        type: DataTypes.INTEGER,
      },
      order_number: {
        type: DataTypes.INTEGER,
      },
      created_by: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      updated_by: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      deleted_by: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: 'KfaLevel',
      underscored: true,
      paranoid: true,
      tableName: 'kfa_levels',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  )
  return KfaLevel
}
