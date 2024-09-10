const {
  Model,
} = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class NewOpname extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.NewOpnameItem, {
        as: 'new_opname_items',
        foreignKey: 'new_opname_id',
      })

      this.belongsTo(models.Entity, {
        as: 'entity',
        foreignKey: 'entity_id',
      })

      this.belongsTo(models.OpnamePeriod, {
        as: 'period',
        foreignKey: 'period_id',
      })

      this.belongsTo(models.MasterActivity, {
        as: 'activity',
        foreignKey: 'activity_id',
      })

      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['created_by', 'updated_by', 'deleted_by']
      userFields.forEach((item) => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      // define association here
      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }
        if (!options.without_relations) {
          modelInclude = [
            ...modelInclude,
            {
              association: 'entity',
              attributes: models.Entity.getBasicAttribute(),
            },
            {
              association: 'new_opname_items',
              separate: true,
              include: [{
                association: 'new_opname_stocks',
              }, {
                association: 'material',
                attributes: models.Material.getBasicAttribute(),
              }],
            },
            ...userFields.map((item) => ({
              association: `user_${item}`,
              attributes: userAttributes,
            })),
          ]
        }

        options.include = modelInclude
      })
    }
  }
  NewOpname.init({
    entity_id: DataTypes.INTEGER,
    period_id: DataTypes.BIGINT,
    deleted_at: DataTypes.DATE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    status: DataTypes.TINYINT
  }, {
    sequelize,
    modelName: 'NewOpname',
    tableName: 'new_opnames',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  NewOpname.getBasicAttribute = function () {
    return [
      'id',
      'entity_id',
      'period_id',
      'created_by',
      'created_at',
      'status'
    ]
  }

  return NewOpname
}
