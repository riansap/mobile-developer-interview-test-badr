import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class OrderTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.Order, { through: models.OrderOrderTag })
      this.addHook('beforeFind', options => {
        if (options.attributes === undefined) {
          options.attributes = ['id', 'title']
        }
      })

      this.addHook('afterCreate', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
      this.addHook('afterUpdate', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
      })
      this.addHook('afterDestroy', (model) => {
        delete model.dataValues['created_at']
        delete model.dataValues['updated_at']
        delete model.dataValues['deleted_at']
      })
    }
  }
  OrderTag.init({
    title: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'OrderTag',
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at'
  })

  sequelizePaginate.paginate(OrderTag)

  return OrderTag
}