import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class SubDistrict extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Regency, { as: 'regency' })
    }
  }

  SubDistrict.init({
    name: DataTypes.STRING,
    regency_id: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'SubDistrict',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  sequelizePaginate.paginate(SubDistrict)

  return SubDistrict
}