import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import { getLabelByKey, STATUS } from '../helpers/constants'

export default (sequelize, DataTypes) => {
  class Manufacture extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      const userAlias = ['created_by', 'updated_by', 'deleted_by']
      const userAttributes = [
        'id',
        'username',
        'email',
        'firstname',
        'lastname'
      ]
      userAlias.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      this.belongsToMany(models.Material, {
        as: 'materials',
        through: 'material_manufacture',
        foreignKey: 'manufacture_id',
        otherKey: 'material_id'
      })

      this.belongsToMany(models.MasterMaterial, {
        as : 'master_materials',
        through : 'master_material_has_manufactures',
        foreignKey : 'manufacture_id',
        otherKey : 'master_material_id',
        timestamps: false
      })

      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = options.include
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }
        options.include = [
          ...modelInclude,
          ...userAlias.map(item => ({
            model: models.User,
            as: `user_${item}`,
            attributes: userAttributes
          }))
        ]

        if (options.attributes === undefined) {
          options.attributes = [
            'id',
            'name',
            'reference_id',
            'description',
            'contact_name',
            'phone_number',
            'email',
            'address',
            'status',
            'type',
            'is_asset',
            'updated_at',
            'updated_by',
          ]
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

  Manufacture.init({
    name: DataTypes.STRING,
    reference_id: DataTypes.STRING,
    description: DataTypes.TEXT,
    contact_name: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    email: DataTypes.STRING,
    address: DataTypes.TEXT,
    village_id: DataTypes.INTEGER,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    status: DataTypes.TINYINT,
    production_date: DataTypes.DATE,
    production_year: DataTypes.INTEGER,
    type: DataTypes.TINYINT,
    is_asset: DataTypes.TINYINT,
    status_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getLabelByKey(STATUS, this.status)
      },
    },
    user_updated_by_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.user_updated_by) {
          return `${this.user_updated_by.firstname ?? ''} ${this.user_updated_by.lastname ?? ''}`
        }
        return ''
      },
    },
  }, {
    sequelize,
    modelName: 'Manufacture',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(Manufacture)

  Manufacture.getBasicAttribute = function () {
    return [
      'name',
      'reference_id',
      'description',
      'contact_name',
      'phone_number',
      'email',
      'address',
      'village_id',
      'status',
      'production_date',
      'production_year',
      'type',
      'is_asset',
      'status_label',
      'user_updated_by_label',
    ]
  }

  return Manufacture
}
