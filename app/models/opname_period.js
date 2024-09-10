const {
  Model,
} = require('sequelize')
  
module.exports = (sequelize, DataTypes) => {
  class OpnamePeriod extends Model {
    /**
       * Helper method for defining associations.
       * This method is not a part of Sequelize lifecycle.
       * The `models/index` file will call this method automatically.
       */
    static associate(models) {
      this.hasOne(models.User, {
        as: 'user_created_by',
        foreignKey: 'id',
        sourceKey : 'created_by'
      })
      this.hasOne(models.User, {
        as: 'user_updated_by',
        foreignKey: 'id',
        sourceKey : 'updated_by'
      })
    }
  }

  OpnamePeriod.init({
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    status: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    deleted_at: DataTypes.DATE,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    month_periode : DataTypes.TINYINT,
    year_periode : DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'OpnamePeriod',
    tableName: 'opname_period',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })
  
  OpnamePeriod.getBasicAttribute = function () {
    return [
      'id',
      'start_date',
      'end_date',
      'status',
      'created_by',
      'updated_by',
      'deleted_by',
      'created_at',
      'updated_at',
      'deleted_at',
      'month_periode',
      'year_periode'
    ]
  }
  
  return OpnamePeriod
}
  