import { Model, Op } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'
import moment from 'moment-timezone'

export default (sequelize, DataTypes) => {
  class Batch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Manufacture, {
        as: 'manufacture',
        foreignKey: 'manufacture_id'
      })

      this.hasMany(models.Stock, {
        as: 'stocks',
        foreignKey: 'batch_id'
      })

      Batch.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
        }
      })
    }
  }
  Batch.init({
    code: DataTypes.STRING,
    expired_date: {
      type: DataTypes.DATE,
      set(value) {
        // if(value)
        const formatDate = moment(value).format('YYYY-MM-DD')
        this.setDataValue('expired_date', `${formatDate} 21:59:59`)
      },
    },
    production_date: DataTypes.DATE,
    manufacture_id: DataTypes.INTEGER,
    status : DataTypes.TINYINT,
    manufacture_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.manufacture ? this.manufacture.name : ''
      },
      set(value) {
        throw new Error('Do not try to set the `manufacture_name` value!')
      }
    }
  }, {
    sequelize,
    modelName: 'Batch',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  Batch.addHook('afterCreate', (model) => {
    delete model.dataValues['created_at']
    delete model.dataValues['updated_at']
  })
  Batch.addHook('afterUpdate', (model) => {
    delete model.dataValues['created_at']
    delete model.dataValues['updated_at']
  })
  Batch.addHook('afterDestroy', (model) => {
    delete model.dataValues['created_at']
    delete model.dataValues['updated_at']
    delete model.dataValues['deleted_at']
  })

  sequelizePaginate.paginate(Batch)
  Batch.getBasicAttribute = function () {
    return ['id', 'code', 'expired_date', 'production_date', 'manufacture_id', 'manufacture_name', 'status']
  }

  Batch.addScope('not_expired', {
    where: {
      expired_date: {
        [Op.gte]: moment().add(-5, 'days').toDate()
      }
    }
  })

  Batch.isExpired = function(expiredDate) {
    return moment().toDate() > moment(expiredDate).add(5, 'days').toDate()
  }

  return Batch
}
