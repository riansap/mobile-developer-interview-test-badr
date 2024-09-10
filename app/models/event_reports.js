const {
  Model,
} = require('sequelize')

const { EVENT_REPORT_STATUS, getEventReportLabel } = require('../helpers/constants')

const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
const userFields = ['created_by', 'updated_by', 'deleted_by', 'finished_by']

module.exports = (sequelize, DataTypes) => {
  class EventReport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.EventReportItem, {
        as: 'items',
        foreignKey: 'event_report_id',
      })

      this.hasMany(models.EventReportComment, {
        as: 'comments',
        foreignKey: 'event_report_id',
      })

      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey: 'entity_id',
      })

      this.belongsTo(models.Order, {
        as: 'order',
        foreignKey: 'order_id',
      })

      userFields.forEach((item) => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      this.addHook('afterCreate', async (model, options) => {
        await this.createHistory(models, model, options)
      })
      this.addHook('afterUpdate', async (model, options) => {
        // eslint-disable-next-line no-underscore-dangle
        if (model._previousDataValues.status !== model.status) {
          await this.createHistory(models, model, options)
        }
      })

      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }
        if (!options.without_relations) {
          modelInclude = [
            ...modelInclude,
            ...this.getAssociation(),
          ]
        }

        options.include = modelInclude
      })
    }
  }
  EventReport.init({
    event_report_id: {
      type: DataTypes.VIRTUAL,
      get() {
        return `LK-${this.id}`
      },
    },
    entity_id: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    order_id: DataTypes.BIGINT,
    no_packing_slip: DataTypes.STRING,
    has_order: DataTypes.INTEGER,
    arrived_date: DataTypes.DATE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    finished_by: DataTypes.BIGINT,
    finished_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    deleted_by: DataTypes.BIGINT,
    canceled_at: DataTypes.DATE,
    canceled_by: DataTypes.BIGINT,
    status_label: {
      type: DataTypes.VIRTUAL,
      get() {
        return getEventReportLabel(this.status)
      },
    },
    link: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'EventReport',
    tableName: 'event_reports',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  })

  EventReport.createHistory = async (models, model, options) => {
    const history = await models.EventReportHistory.create({
      event_report_id: model.id,
      status: model.status ?? EVENT_REPORT_STATUS.CREATE,
      updated_by: model.updated_by,
    }, { transaction: options.transaction })
    if (!history) return false
    return true
  }

  EventReport.getAssociation = function () {
    const assoc = [
      {
        association: 'entity',
        attributes: ['id', 'name', 'province_id', 'regency_id'],
        include: [
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
        ],
      },
      {
        association : 'order',
        attributes : ['id', 'activity_id'],
        include : [
          {
            association : 'activity', attributes : ['id', 'name'], paranoid : false
          }
        ]
      },
      {
        association: 'items',
        separate: true,
        include: [{
          association: 'material',
          attributes: ['id', 'name'],
        }, {
          association: 'reason', attributes: ['id', 'title'],
        }, {
          association: 'child_reason', attributes: ['id', 'title'],
        }],
      },
      {
        association: 'comments',
        separate: true,
        include: [{
          association: 'user',
          attributes: ['id', 'firstname', 'lastname', 'username'],
        }],
      },
      ...userFields.map((item) => ({
        association: `user_${item}`,
        attributes: userAttributes,
      })),
    ]
    return assoc
  }

  return EventReport
}
