import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class OrderReport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Entity, { as: 'entity', foreignKey: 'entity_id' })
      this.belongsTo(models.Material, { as: 'material', foreignKey: 'material_id' })
      // define association here
      this.addHook('beforeFind', options => {
        if (options.attributes === undefined) {
          options.attributes = this.getBasicAttribute()
        }
      })
    }
  }
  OrderReport.init({
    material_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    batch_code: DataTypes.STRING,
    batch_expired: DataTypes.STRING,
    batch_production: DataTypes.STRING,
    arrived_date: DataTypes.DATE,
    arrived_qty: DataTypes.INTEGER,
    message: DataTypes.TEXT,
    entity_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.entity ? this.entity.name : ''
      }
    },
    material_name: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.material ? this.material.name : ''
      }
    },
    province_name: {
      type: DataTypes.VIRTUAL,
      get() {
        if(this.entity) {
          return this.entity.province ? this.entity.province.name : ''  
        }
        return ''
      }
    },
  }, {
    sequelize,
    modelName: 'OrderReport',
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(OrderReport)

  OrderReport.getBasicAttribute = function() {
    return [
      'id', 
      'material_id', 
      'entity_id', 
      'batch_code', 
      'batch_expired', 
      'batch_production', 
      'message', 
      'arrived_date', 
      'arrived_qty', 
      'created_at',
      'entity_name',
      'province_name',
      'material_name'
    ]
  }

  return OrderReport
}