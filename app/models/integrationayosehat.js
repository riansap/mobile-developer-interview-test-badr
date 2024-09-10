import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class IntegrationAyoSehat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.MasterMaterial, { as: 'masterMaterial', foreignKey: 'material_id' })
      this.belongsTo(models.Entity, { as: 'customer', foreignKey: 'customer_id' })
      this.belongsTo(models.Entity, { as: 'vendor', foreignKey: 'vendor_id' })
      this.belongsTo(models.MasterActivity, { as: 'activity', foreignKey: 'activity_id' })
      this.belongsTo(models.Stock, { as: 'stock', foreignKey: 'stock_id' })
      this.belongsTo(models.Batch, { as: 'batch', foreignKey: 'batch_id' })

      this.belongsTo(models.User, {
        as: 'user_created',
        foreignKey: 'created_by'
      })

      this.addHook('beforeFind', (options) => {
        if (!options.attributes) {
          options.attributes = this.getBasicAttribute()
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
      })
    }
  }
  IntegrationAyoSehat.init({
    vendor_id: DataTypes.INTEGER,
    customer_id: DataTypes.INTEGER,
    activity_id: DataTypes.INTEGER,
    material_id: DataTypes.INTEGER,
    stock_id: DataTypes.BIGINT,
    batch_id: DataTypes.BIGINT,
    status_vvm: DataTypes.TINYINT,
    consumed_qty: DataTypes.DOUBLE,
    consumed_qty_openvial: DataTypes.DOUBLE,
    consumed_qty_closevial: DataTypes.DOUBLE,
    transaction_id_consumed: DataTypes.INTEGER,
    created_at_consumed_smile: DataTypes.DATE,
    consumed_status: DataTypes.TINYINT,
    session_id: DataTypes.STRING,
    transaction_id_return: DataTypes.INTEGER,
    return_qty: DataTypes.DOUBLE,
    return_qty_openvial: DataTypes.DOUBLE,
    return_qty_closevial: DataTypes.DOUBLE,
    transaction_id_injection: DataTypes.INTEGER,
    injection_qty: DataTypes.DOUBLE,
    created_at_injection: DataTypes.DATE,
    created_at_return_vaccination: DataTypes.DATE,
    updated_at_return_vaccination: DataTypes.DATE,
    return_status: DataTypes.TINYINT,
    return_validation: DataTypes.TINYINT,
    integration_status: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
  }, {
    sequelize,
    modelName: 'IntegrationAyoSehat',
    tableName: 'integration_ayo_sehat',
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })
  sequelizePaginate.paginate(IntegrationAyoSehat)

  IntegrationAyoSehat.getBasicAttribute = function () {
    return [
      'id',
      'vendor_id',
      'customer_id',
      'activity_id',
      'material_id',
      'stock_id',
      'batch_id',
      'status_vvm',
      'consumed_qty',
      'consumed_qty_openvial',
      'consumed_qty_closevial',
      'transaction_id_consumed',
      'created_at_consumed_smile',
      'consumed_status',
      'session_id',
      'transaction_id_return',
      'return_qty',
      'return_qty_openvial',
      'return_qty_closevial',
      'transaction_id_injection',
      'injection_qty',
      'created_at_injection',
      'created_at_return_vaccination',
      'updated_at_return_vaccination',
      'return_status',
      'return_validation',
      'integration_status',
      'created_at',
      'updated_at',
      'created_by',
    ]
  }

  return IntegrationAyoSehat
}