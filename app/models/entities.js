import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'
import { ENTITY_TYPE, getLabelByKey } from '../helpers/constants'
import { mainSchema } from '../../config/schema'

export default (sequelize, DataTypes) => {
  class Entity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Province, {
        as: 'province',
        foreignKey: 'province_id',
      })
      this.belongsTo(models.Regency, {
        as: 'regency',
        foreignKey: 'regency_id',
      })
      this.belongsTo(models.SubDistrict, {
        as: 'sub_district',
        foreignKey: 'sub_district_id',
      })
      this.belongsTo(models.Village, {
        as: 'village',
        foreignKey: 'village_id',
      })
      this.belongsToMany(models.Entity, {
        as: 'vendors',
        through: 'customer_vendors',
        foreignKey: 'customer_id',
        otherKey: 'vendor_id',
        timestamps: false,
      })

      this.hasMany(models.YearlyPlan, {
        as: 'yearly_plan',
        foreignKey: 'entity_regency_id'
      })

      this.hasMany(models.User, {
        as: 'users',
      })

      this.hasMany(models.AssetIot, {
        as: 'assets',
        foreignKey: 'entity_id'
      })

      this.belongsToMany(models.Entity, {
        as: 'customers',
        through: 'customer_vendors',
        foreignKey: 'vendor_id',
        otherKey: 'customer_id',
        timestamps: false,
      })

      this.belongsToMany(models.EntityTag, {
        as: 'entity_tags',
        through: 'entity_entity_tags',
        foreignKey: 'entity_id',
        otherKey: 'entity_tag_id',
        timestamps: false,
      })

      this.hasMany(models.TrackDevice, {
        as: 'track_devices',
        foreignKey: 'entity_id',
      })

      this.hasMany(models.IntegrationAyoSehat, {
        as: 'vendor_ayo_sehat',
        foreignKey: 'vendor_id',
      })

      this.hasMany(models.IntegrationAyoSehat, {
        as: 'customer_ayo_sehat',
        foreignKey: 'customer_id',
      })

      this.hasOne(models.MappingEntity, {
        as: 'mapping_entity',
        foreignKey: 'id_entitas_smile',
        sourceKey: 'id',
      })

      this.hasOne(models.Coldstorage, {
        as : 'coldstorage',
        foreignKey: 'entity_id',
        sourceKey: 'id'
      })

      this.belongsToMany(models.MasterActivity, {
        as: 'activities_date',
        through: 'entity_activity_date',
        foreignKey: 'entity_id',
        otherKey: 'activity_id',
        timestamps: false,
      })

      const userAttributes = [
        'id',
        'username',
        'email',
        'firstname',
        'lastname',
      ]
      const userFields = ['created_by', 'updated_by', 'deleted_by']
      userFields.forEach((item) => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (
          typeof options.include === 'object' &&
          options.include !== null
        ) {
          modelInclude = [options.include]
        }

        if (!options.include && !options.is_notif) {
          options.include = [
            ...modelInclude,
            ...userFields.map((item) => ({
              model: models.User,
              as: `user_${item}`,
              attributes: userAttributes,
            })),
            {
              association: 'entity_tags',
              attributes: ['id', 'title'],
              through: { attributes: [] },
            },
          ]
        }
      })
    }
  }

  Entity.init(
    {
      name: DataTypes.STRING,
      address: DataTypes.TEXT,
      code: DataTypes.STRING,
      village_id: DataTypes.STRING,
      province_id: DataTypes.STRING,
      regency_id: DataTypes.STRING,
      region_id: DataTypes.INTEGER,
      created_by: DataTypes.BIGINT,
      updated_by: DataTypes.BIGINT,
      deleted_by: DataTypes.BIGINT,
      type: DataTypes.TINYINT,
      status: DataTypes.TINYINT,
      is_puskesmas: DataTypes.TINYINT,
      is_vendor: {
        type: DataTypes.TINYINT,
        defaultValue: 1,
      },
      is_ayosehat: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
      },
      country: {
        type: DataTypes.STRING,
        defaultValue: 'ID',
      },
      postal_code: DataTypes.STRING,
      lat: DataTypes.STRING,
      lng: DataTypes.STRING,
      accuracy: DataTypes.STRING,
      gps_errors: DataTypes.STRING,
      sub_district_id: DataTypes.STRING,
      type_label: {
        type: DataTypes.VIRTUAL,
        get() {
          return getLabelByKey(ENTITY_TYPE, this.type)
        },
      },
      bpom_key: DataTypes.STRING,
      rutin_join_date: DataTypes.DATE,
      province_id_old: DataTypes.STRING,
      province_id_new: DataTypes.STRING,
      regency_id_old: DataTypes.STRING,
      regency_id_new: DataTypes.STRING,
      sub_district_id_old: DataTypes.STRING,
      sub_district_id_new: DataTypes.STRING,
      village_id_old: DataTypes.STRING,
      village_id_new: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Entity',
      underscored: true,
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
      schema: mainSchema,
    }
  )

  Entity.addHook('beforeFind', (options) => {
    if (!options.attributes) {
      options.attributes = Entity.getBasicAttribute()
    }
  })

  Entity.addHook('beforeBulkCreate', (model) => {
    for (let index = 0; index < model.length; index++) {
      if (model[index].dataValues['is_vendor'] === null) {
        delete model[index].dataValues['is_vendor']
      }
    }
  })

  Entity.addHook('afterCreate', (model) => {
    // entityNotification(model)

    delete model.dataValues['created_at']
    delete model.dataValues['updated_at']
  })
  Entity.addHook('afterUpdate', (model) => {
    delete model.dataValues['created_at']
    delete model.dataValues['updated_at']
  })
  Entity.addHook('afterDestroy', (model) => {
    delete model.dataValues['created_at']
    delete model.dataValues['updated_at']
    delete model.dataValues['deleted_at']
  })

  Entity.getBasicAttribute = function () {
    return [
      'id',
      'name',
      'address',
      'code',
      'type',
      'status',
      'created_at',
      'updated_at',
      'deleted_at',
      'province_id',
      'regency_id',
      'village_id',
      'sub_district_id',
      'lat',
      'lng',
      'postal_code',
      'type_label',
      'is_vendor',
      'bpom_key',
      'is_puskesmas',
      'rutin_join_date',
      'is_ayosehat',
    ]
  }
  sequelizePaginate.paginate(Entity)

  return Entity
}
