import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class OrderItemKfa extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.MappingMasterMaterial, { as: 'mapping_master_material', foreignKey: 'code_kfa_product_template', sourceKey: 'code_kfa_product_template' })
      this.belongsTo(models.Order, { as: 'order', foreignKey: 'order_id' })
      this.hasMany(models.OrderItem, {as : 'order_items', foreignKey: 'order_item_kfa_id'})
    }
  }
  OrderItemKfa.init({
    order_id: DataTypes.BIGINT,
    code_kfa_product_template: DataTypes.STRING,
    qty : DataTypes.DOUBLE,
    recomended_stock : DataTypes.DOUBLE,
    reason_id: DataTypes.INTEGER,
    other_reason: DataTypes.STRING,
    confirmed_qty: DataTypes.DOUBLE,
    name_kfa_product_template : {
        type: DataTypes.VIRTUAL,
        get(){
            if(this.mapping_master_material)
                return this.mapping_master_material?.name_kfa_product_template
            else return ''
        }
    }
  }, {
    sequelize,
    modelName: 'OrderItemKfa',
    tableName: 'order_items_kfa',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(OrderItemKfa)

  OrderItemKfa.getBasicAttribute = function() {
    return [
      'id',
      'order_id',
      'code_kfa_product_template',
      'qty',
      'recommended_stock',
      'confirmed_qty',
      'reason_id',
      'other_reason',
      'name_kfa_product_template',
      'created_at',
      'updated_at'
    ]
  }

  return OrderItemKfa
}