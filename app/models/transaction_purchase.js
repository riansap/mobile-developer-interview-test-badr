import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class TransactionPurchase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Transaction, { as: 'transaction' })
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

  TransactionPurchase.init({
    transaction_id: DataTypes.INTEGER,
    source_material_id: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    price: DataTypes.DOUBLE,
    pieces_purchase_id: DataTypes.INTEGER,
    total_price: DataTypes.DOUBLE
  }, {
    sequelize,
    modelName: 'TransactionPurchase',
    tableName: 'transaction_purchase',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  })

  return TransactionPurchase
}