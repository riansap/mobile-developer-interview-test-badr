import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class UpdateStock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
  }

  UpdateStock.init({
    province_id: DataTypes.INTEGER,
    regency_id: DataTypes.INTEGER,
    master_material_id: DataTypes.INTEGER,
    qty: DataTypes.INTEGER,
    stocks: DataTypes.TEXT,
    date_cutoff: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'UpdateStock',
    tableName: 'update_stocks',
    paranoid: true,
  })

  sequelizePaginate.paginate(UpdateStock)

  return UpdateStock
}