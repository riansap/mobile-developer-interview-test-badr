import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class IntegrationEmonevRegency extends Model {
    /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
    static associate(models) {

      this.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
        }
      })

      this.addHook('afterCreate', (model) => {
        delete model.dataValues['createdAt']
        delete model.dataValues['updatedAt']
      })
      this.addHook('afterUpdate', (model) => {
        delete model.dataValues['createdAt']
        delete model.dataValues['updatedAt']
      })
      this.addHook('afterDestroy', (model) => {
        delete model.dataValues['createdAt']
        delete model.dataValues['updatedAt']
      })
    }
  }
  IntegrationEmonevRegency.init({
    regency_id: DataTypes.INTEGER,
    trader_id: DataTypes.STRING,
    code: DataTypes.STRING,
    name: DataTypes.STRING,
    npwp: DataTypes.STRING,
    permit: DataTypes.STRING,
    permit_date: DataTypes.DATE,
    pic: DataTypes.STRING,
    pic_email: DataTypes.STRING,
    pic_phone: DataTypes.STRING,
    pimpinan: DataTypes.STRING,
    pimpinan_phone: DataTypes.STRING,
    pimpinan_email: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'IntegrationEmonevRegency',
    tableName: 'integration_emonev_regencies',
    paranoid: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt',
    deletedAt: 'deletedAt',
  })
  sequelizePaginate.paginate(IntegrationEmonevRegency)

  IntegrationEmonevRegency.getBasicAttribute = function () {
    return [
      'id',
      'code',
      'trader_id',
      'regency_id',
      'name'
    ]
  }

  return IntegrationEmonevRegency
}