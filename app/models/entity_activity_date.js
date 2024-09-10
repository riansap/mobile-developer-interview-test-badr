'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class EntityActivityDate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Entity, {
        foreignKey: 'entity_id',
      })

      this.belongsTo(models.MasterActivity, {
        foreignKey: 'activity_id',
      })
    }
  }

  EntityActivityDate.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    entity_id: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    activity_id: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    join_date: {
      type: DataTypes.DATEONLY
    },
    end_date: {
      type: DataTypes.DATEONLY
    }
  }, {
    sequelize,
    modelName: 'EntityActivityDate',
    underscored: true,
    paranoid: true,
    tableName: 'entity_activity_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  })
  return EntityActivityDate
}