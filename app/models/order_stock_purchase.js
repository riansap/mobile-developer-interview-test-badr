import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class OrderStockPurchase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.OrderStock, { as: 'order_stock' })
      this.belongsTo(models.SourceMaterial, {
        as: 'source_material',
        foreignKey: 'source_material_id'
      })
      this.belongsTo(models.PiecesPurchase, {
        as: 'pieces_purchase',
        foreignKey: 'pieces_purchase_id'
      })
    }


  }

  OrderStockPurchase.init({
    order_stock_id: DataTypes.INTEGER,
    source_material_id: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    price: DataTypes.DOUBLE,
    pieces_purchase_id: DataTypes.INTEGER,
    total_price: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'OrderStockPurchase',
    tableName: 'order_stock_purchase',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  })

  OrderStockPurchase.getBasicAttributes = function () {
    return ['id', 'source_material_id', 'year', 'price', 'pieces_purchase_id', 'total_price']
  }

  return OrderStockPurchase
}