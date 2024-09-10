import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class YearlyStockProvince extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
  }

  YearlyStockProvince.init({
    province_id: DataTypes.INTEGER,
    master_material_id: DataTypes.INTEGER,
    year: DataTypes.INTEGER,
    qty: DataTypes.INTEGER,
    consumption: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'YearlyStockProvince',
    tableName: 'yearly_stock_province',
    paranoid: true,
  })

  sequelizePaginate.paginate(YearlyStockProvince)

  return YearlyStockProvince
}