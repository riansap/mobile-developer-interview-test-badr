import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import { getHash } from '../helpers/password'
import {
  USER_ROLE, getLabelByKey, STATUS, USER_GENDER,
} from '../helpers/constants'
import { mainSchema } from '../../config/schema'
import { formatWIB } from '../helpers/common'
import { userCreatedTemplate } from '../templates/userCreated'
import { publishWorker } from '../helpers/services/rabbitmqHelper'

const HISTORY_FIELD = [
  'mobile_phone',
  'email',
]
export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // entity
      this.belongsTo(models.Entity, { as: 'entity', foreignKey: 'entity_id' })
      this.belongsTo(models.Village, { as: 'village', foreignKey: 'village_id' })
      this.belongsTo(models.Manufacture, { as: 'manufacture', foreignKey: 'manufacture_id' })
      this.belongsToMany(models.UserTag, { through: 'user_user_tags' })
      this.hasOne(models.User, { as: 'createdby', foreignKey: 'id', sourceKey: 'created_by' })
      this.hasOne(models.User, { as: 'updatedby', foreignKey: 'id', sourceKey: 'updated_by' })

      User.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
        }
        // village
      })

      User.addHook('afterUpdate', async (instance, options) => {
        // check update in history field
        let oldVal = {}
        let newVal = {}
        // console.log(oldVal)
        HISTORY_FIELD.forEach((field) => {
          // detect update
          if (instance._previousDataValues[field] !== instance[field]) {
            oldVal[field] = instance._previousDataValues[field]
            newVal[field] = instance[field]
          }
        })

        oldVal = JSON.stringify(oldVal)
        newVal = JSON.stringify(newVal)
        if (newVal !== '{}' || oldVal !== '{}') {
          const userUpdate = await models.User.findByPk(instance.updated_by)
          const chgHistory = {
            user_id: instance.id,
            updated_by: `${userUpdate.firstname} ${userUpdate?.lastname || ''}`,
            old_values: oldVal,
            new_values: newVal,
          }
          const opt = options ? { transaction: options.transaction } : {}
          await models.UserChgHistory.create(chgHistory, opt)
        }
      })

      User.addHook('afterCreate', async (instance, options) => {
        // instance
        instance.sendCreatedEmail(options)
      })

      User.addHook('afterBulkCreate', async (instance, options) => {
        // instance
        instance.forEach((model) => {
          model.sendCreatedEmail(options)
        })
      })
    }
  }

  User.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: {
      type: DataTypes.STRING,
      set(value) {
        if (value) {
          this.setDataValue('password', getHash(value))
        }
      },
    },
    firstname: DataTypes.STRING,
    lastname: DataTypes.STRING,
    gender: DataTypes.TINYINT,
    date_of_birth: DataTypes.DATE,
    mobile_phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    role: DataTypes.INTEGER,
    village_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    timezone_id: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER,
    deleted_by: DataTypes.INTEGER,
    token_login: DataTypes.TEXT,
    status: DataTypes.TINYINT,
    mobile_phone_2: DataTypes.STRING,
    mobile_phone_brand: DataTypes.STRING,
    mobile_phone_model: DataTypes.STRING,
    imei_number: DataTypes.STRING,
    sim_provider: DataTypes.STRING,
    sim_id: DataTypes.STRING,
    iota_app_gui_theme: DataTypes.STRING,
    permission: DataTypes.STRING,
    application_version: DataTypes.STRING,
    last_login: DataTypes.DATE,
    last_mobile_access: DataTypes.DATE,
    last_device: DataTypes.TINYINT,
    change_password: DataTypes.TINYINT,
    manufacture_id: DataTypes.INTEGER,
    fcm_token: DataTypes.STRING,
    role_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getLabelByKey(USER_ROLE, this.role)
      },
    },
    entity_name: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.entity) return this.entity.name
        return ''
      },
    },
    status_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getLabelByKey(STATUS, this.status)
      },
    },
    gender_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getLabelByKey(USER_GENDER, this.gender)
      },
    },
    province_name: {
      type: DataTypes.VIRTUAL,
      get() {
        let name = ''
        const province = this.village?.sub_district?.regency?.province
        if (province) name = province.name
        return name
      },
    },
    regency_name: {
      type: DataTypes.VIRTUAL,
      get() {
        let name = ''
        const regency = this.village?.sub_district?.regency
        if (regency) name = regency.name
        return name
      },
    },
    entity_tag_name: {
      type: DataTypes.VIRTUAL,
      get() {
        let name = ''
        const entityTags = this.entity?.entity_tags
        if (entityTags) name = entityTags.map((el) => el.title).join(',')
        return name
      },
    },
    view_only: {
      type: DataTypes.INTEGER,
    },
    fullname: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.lastname) return `${this.firstname} ${this.lastname}`
        return this.firstname
      },
    },
    last_login_wib: {
      type: DataTypes.VIRTUAL,
      get() {
        if (this.last_login) return formatWIB(this.last_login)
        return ''
      },
    },
  }, {
    sequelize,
    modelName: 'User',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    schema: mainSchema,
  })

  sequelizePaginate.paginate(User)

  User.getBasicAttribute = function () {
    return [
      'id',
      'username',
      'email',
      'firstname',
      'lastname',
      'gender',
      'date_of_birth',
      'mobile_phone',
      'role',
      'village_id',
      'entity_id',
      'timezone_id',
      'created_by',
      'updated_by',
      'status',
      'last_login',
      'last_device',
      'created_at',
      'updated_at',
      'address',
      'role_label',
      'entity_name',
      'status_label',
      'gender_label',
      'province_name',
      'regency_name',
      'view_only',
      'change_password',
      'manufacture_id',
      'fcm_token',
    ]
  }

  User.prototype.sendCreatedEmail = async function (options) {
    const { locale, subject } = options
    const template = userCreatedTemplate(this, locale)
    const payload = { mail: this.email, subject, content: template }
    console.log(payload)
    publishWorker('email-notification', payload)
  }

  User.addScope('active', {
    where: {
      status: STATUS.ACTIVE,
    },
  })
  return User
}
