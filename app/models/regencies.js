import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class Regency extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Province, { as: 'province' })
    }
  }
  Regency.init({
    name: DataTypes.STRING,
    province_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Regency',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  sequelizePaginate.paginate(Regency)

  return Regency
}