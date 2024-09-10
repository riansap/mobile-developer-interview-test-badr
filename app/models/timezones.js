import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class Timezone extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  Timezone.init({
    title: DataTypes.STRING,
    utc_relative: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Timezone',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })
  sequelizePaginate.paginate(Timezone)
  return Timezone
}