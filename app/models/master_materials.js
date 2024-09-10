'use strict'
const {
  Model
} = require('sequelize')

const i18n = require('i18n')

const { STATUS, getLabelByKey, KFA_LEVEL_ID } = require('../helpers/constants')

module.exports = (sequelize, DataTypes) => {
  class MasterMaterial extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    
    static associate(models) {
      // define association here
      this.belongsToMany(models.MasterActivity, {
        as: 'material_activities',
        through: 'master_material_has_activities',
        foreignKey: 'master_material_id',
        otherKey: 'activity_id',
        timestamps: false
      })

      this.hasOne(models.User, {
        as: 'user_updated_by',
        foreignKey: 'id',
        sourceKey : 'updated_by'
      })

      this.hasOne(models.MappingMasterMaterial, {
        as : 'mapping_master_material',
        foreignKey : 'id_material_smile',
        sourceKey : 'id'
      })

      this.hasOne(models.MasterMaterialType, {
        as : 'material_type',
        foreignKey : 'id',
        sourceKey : 'is_vaccine'
      })

      this.hasOne(models.RangeTemperature, {
        as : 'range_temperature',
        foreignKey : 'id',
        sourceKey : 'range_temperature_id'
      })

      this.belongsToMany(models.Manufacture, {
        as: 'manufactures',
        through: 'master_material_has_manufactures',
        foreignKey: 'master_material_id',
        otherKey: 'manufacture_id',
        timestamps: false
      })

      this.belongsToMany(models.MasterMaterial, {
        as: 'material_companion',
        through: 'master_material_has_companions',
        foreignKey: 'master_material_id',
        otherKey: 'master_material_companion_id',
        timestamps: false
      })

      this.hasMany(models.MasterMaterialCondition, {
        as: 'material_conditions',
        foreignKey: 'master_material_id'
      })

      this.belongsToMany(models.MaterialTag, {
        as: 'material_tags',
        through: 'material_material_tag',
        foreignKey: 'material_id',
        otherKey: 'material_tag_id'
      })

      this.hasMany(models.NewOpnameItem, {
        as : 'new_opname_items',
        foreignKey: 'master_material_id'
      })

      this.hasOne(models.KfaLevel, {
        as: 'kfa_level',
        foreignKey: 'id',
        sourceKey : 'kfa_level_id'
      })

      this.belongsTo(models.MasterMaterial, {
        as: 'parent',
        foreignKey: 'parent_id'
      })

      this.hasMany(models.MasterMaterial, {
        as: 'children',
        foreignKey: 'parent_id'
      })
    }
  }
  MasterMaterial.init({
    name: DataTypes.STRING,
    unit_of_distribution: DataTypes.STRING,
    code: DataTypes.STRING,
    description: DataTypes.STRING,
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
    is_openvial: DataTypes.TINYINT,
    kfa_code:   DataTypes.STRING,
    need_sequence: DataTypes.TINYINT,
    range_temperature_id: DataTypes.BIGINT,
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
    material_activities_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.material_activities && this.material_activities.length) {
          return this.material_activities.map((el) => el.name).join(', ')
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
    kfa_level_id: DataTypes.INTEGER,
    kfa_level_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.kfa_level_id) {
          return this.kfa_level_id === KFA_LEVEL_ID.TEMPLATE 
            ? i18n.__('field.kfa_level.template') 
            : i18n.__('field.kfa_level.variant')
        }
        return ''
      },
    },
    parent_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'master_materials',
        key: 'id'
      }
    },
    parent_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.parent) {
          return this.parent.name || ''
        }
        return ''
      },
    },
    parent_kfa_code_label: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.parent) {
          return this.parent.kfa_code || ''
        }
        return ''
      },
    },
  }, {
    sequelize,
    modelName: 'MasterMaterial',
    tableName: 'master_materials',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  MasterMaterial.getBasicAttribute = function () {
    return [
      'id',
      'name',
      'unit_of_distribution',
      'code',
      'description',
      'pieces_per_unit',
      'pieces_per_unit',
      'unit',
      'temperature_sensitive',
      'temperature_min',
      'temperature_max',
      'managed_in_batch',
      'status',
      'is_vaccine',
      'is_stockcount',
      'is_addremove',
      'updated_at',
      'is_openvial',
      'kfa_code',
      'need_sequence',
      'parent_id'
    ]
  }
  return MasterMaterial
}