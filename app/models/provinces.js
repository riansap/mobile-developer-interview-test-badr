import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class Province extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  Province.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Province',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  sequelizePaginate.paginate(Province)

  return Province
}