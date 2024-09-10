const {
  Model,
} = require('sequelize')
  
module.exports = (sequelize, DataTypes) => {
  class DashboardSatusehat extends Model {
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

  DashboardSatusehat.init({
    dashboard_name: DataTypes.DATE,
    api_url: DataTypes.DATE,
    sort: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    deleted_at: DataTypes.DATE,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'DashboardSatusehat',
    tableName: 'dashboard_satusehat',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })
  
  DashboardSatusehat.getBasicAttribute = function () {
    return [
    ]
  }
  
  return DashboardSatusehat
}
  