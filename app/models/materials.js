import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import { STATUS, getLabelByKey } from '../helpers/constants'

export default (sequelize, DataTypes) => {
  class Material extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.MaterialTag, {
        as: 'material_tags',
        through: 'material_material_tag',
        foreignKey: 'material_id',
        otherKey: 'material_tag_id'
      })

      this.belongsToMany(models.Manufacture, {
        as: 'manufactures',
        through: 'material_manufacture',
        foreignKey: 'material_id',
        otherKey: 'manufacture_id'
      })

      this.belongsToMany(models.Material, {
        as: 'material_companion',
        through: 'material_companions',
        foreignKey: 'material_id',
        otherKey: 'material_companion_id',
        timestamps: false
      })

      this.belongsTo(models.MasterMaterial, {
        as: 'master_material',
        foreignKey: 'master_material_id',
      })

      this.hasMany(models.MaterialCondition, {
        as: 'material_conditions',
        foreignKey: 'material_id'
      })

      this.belongsTo(models.User, { as: 'user_created_by', foreignKey: 'created_by' })
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
      this.belongsTo(models.User, { as: 'user_deleted_by', foreignKey: 'deleted_by' })

      this.addHook('beforeFind', (options) => {
        if (options.attributes === undefined) {
          options.attributes = this.getBasicAttribute()
        }

        const userAttributes = [
          'id',
          'username',
          'email',
          'firstname',
          'lastname'
        ]
        const userAlias = ['user_created_by', 'user_updated_by', 'user_deleted_by']

        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }

        options.include = [
          ...modelInclude,
          ...userAlias.map(alias => ({
            model: models.User,
            as: alias,
            attributes: userAttributes
          }))
        ]
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
  Material.init({
    name: DataTypes.STRING,
    code: DataTypes.STRING,
    description: DataTypes.TEXT,
    pieces_per_unit: {
      type: DataTypes.DOUBLE,
      set(value) {
        if(!value) {
          this.setDataValue('pieces_per_unit', 1)
        } else {
          this.setDataValue('pieces_per_unit', value)
        }
      }
    },
    unit: DataTypes.STRING,
    temperature_sensitive: DataTypes.TINYINT,
    temperature_min: DataTypes.DOUBLE,
    temperature_max: DataTypes.DOUBLE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    managed_in_batch: DataTypes.TINYINT,
    status: DataTypes.TINYINT,
    is_vaccine: DataTypes.TINYINT,
    is_stockcount: DataTypes.TINYINT,
    is_addremove: DataTypes.TINYINT,
    bpom_code: DataTypes.INTEGER,
    material_companion_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.material_companion && this.material_companion.length) {
          return this.material_companion.map((el) => el.name).join(', ')
        }
        return ''
      },
    },
    manufactures_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.manufactures && this.manufactures.length) {
          return this.manufactures.map((el) => el.name).join(', ')
        }
        return ''
      },
    },
    material_tags_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.material_tags && this.material_tags.length) {
          return this.material_tags.map((el) => el.title).join(', ')
        }
        return ''
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
    status_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getLabelByKey(STATUS, this.status)
      },
    },
  }, {
    sequelize,
    modelName: 'Material',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  Material.addScope('active', {
    where: { 
      status: STATUS.ACTIVE
    }
  })

  sequelizePaginate.paginate(Material)

  Material.getBasicAttribute = function () {
    return [
      'id',
      'name',
      'code',
      'description',
      'pieces_per_unit',
      'unit',
      'temperature_sensitive',
      'temperature_min',
      'temperature_max',
      'managed_in_batch',
      'status',
      'is_vaccine',
      'is_stockcount',
      'bpom_code',
      'is_addremove',
      'updated_at',
    ]
  }
  return Material
}
