'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class OpnameStock extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.OpnameStockItem, {
        as: 'opname_stock_items',
        foreignKey: 'opname_stock_id'
      })

      this.belongsTo(models.Entity, { 
        as: 'entity', 
        foreignKey: 'entity_id'
      })

      this.belongsTo(models.Material, { 
        as: 'material', 
        foreignKey: 'material_id'
      })

      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['created_by', 'updated_by', 'deleted_by']
      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      // define association here
      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }
        if(!options.without_relations) {
          const reasonAttributes = ['id', 'title']
          modelInclude = [
            ...modelInclude,
            {
              association: 'opname_stock_items',
              attributes: ['id', 'opname_stock_id', 'stock_category', 'stock_category_label', 'smile_qty', 'real_qty'],
              separate: true,
              include: [{
                association: 'reasons',
                attributes: reasonAttributes
              }, {
                association: 'actions',
                attributes: reasonAttributes
              }]
            }, 
            ...userFields.map(item => ({
              association: `user_${item}`,
              attributes: userAttributes
            }))
          ]
        }

        options.include = modelInclude
      })
    }
  }
  OpnameStock.init({
    material_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'OpnameStock',
    tableName: 'opname_stocks',
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  })

  OpnameStock.getBasicAttribute = function () {
    return [
      'id',
      'material_id',
      'entity_id',
      'start_date',
      'end_date',
      'created_by',
      'created_at',
    ]
  }
  
  return OpnameStock
}