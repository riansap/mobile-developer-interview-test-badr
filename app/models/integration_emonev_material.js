import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class IntegrationEmonevMaterial extends Model {
    /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
    static associate(models) {

      this.belongsTo(models.MasterMaterial,{
        as : 'master_material',
        foreignKey : 'master_material_id'
      })

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
  IntegrationEmonevMaterial.init({
    master_material_id : DataTypes.INTEGER,
    tahun : DataTypes.INTEGER,
    nama_xls : DataTypes.STRING,
    type_rop : DataTypes.STRING,
    obat_id : DataTypes.STRING,
    uraian  : DataTypes.STRING
  }, {
    sequelize,
    modelName: 'IntegrationEmonevMaterial',
    tableName: 'integration_emonev_materials',
    paranoid: true,
    updatedAt: 'updatedAt',
    createdAt: 'createdAt',
    deletedAt: 'deletedAt',
  })
  sequelizePaginate.paginate(IntegrationEmonevMaterial)

  IntegrationEmonevMaterial.getBasicAttribute = function () {
    return [
      'id',
      'master_material_id',
      'tahun',
      'nama_xls',
      'obat_id',
      'uraian'
    ]
  }

  return IntegrationEmonevMaterial
}