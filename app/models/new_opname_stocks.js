const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class NewOpnameStock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.NewOpnameItem, {
        as: 'new_opname_item',
        foreignKey: 'new_opname_item_id',
      })
    }
  }
  NewOpnameStock.init({
    new_opname_item_id: DataTypes.INTEGER,
    stock_id: DataTypes.BIGINT,
    batch_id: DataTypes.BIGINT,
    batch_code: DataTypes.STRING,
    expired_date: DataTypes.DATE,
    smile_qty: DataTypes.INTEGER,
    real_qty: DataTypes.INTEGER,
    unsubmit_distribution_qty: DataTypes.INTEGER,
    unsubmit_return_qty: DataTypes.INTEGER,
    deleted_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'NewOpnameStock',
    tableName: 'new_opname_stocks',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })
  return NewOpnameStock
}
