import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class PiecesPurchase extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    }


  }

  PiecesPurchase.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PiecesPurchase',
    tableName: 'pieces_purchase',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true
  })

  return PiecesPurchase
}