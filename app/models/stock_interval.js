import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class StockInterval extends Model {
    static associate(models) {
      // define association here
    }
  }

  StockInterval.init({
    material_entity_id: DataTypes.BIGINT,
    transaction_id: DataTypes.BIGINT,
    opening_qty: DataTypes.DOUBLE,
    change_qty: DataTypes.DOUBLE,
    closing_qty: DataTypes.DOUBLE,
    current_stock: DataTypes.DOUBLE,
    min: DataTypes.DOUBLE,
    max: DataTypes.DOUBLE,
    status_condition: DataTypes.STRING,
    stock_id: DataTypes.BIGINT,
    transaction_type_id: DataTypes.INTEGER,
    material_id: DataTypes.INTEGER,
    customer_id: DataTypes.INTEGER,
    vendor_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    order_id: DataTypes.BIGINT,
    material_name: DataTypes.STRING,
    material_tags: DataTypes.STRING,
    entity_name: DataTypes.STRING,
    entity_tags: DataTypes.STRING,
    entity_province_id: DataTypes.INTEGER,
    entity_province_name: DataTypes.STRING,
    entity_regency_name: DataTypes.STRING,
    entity_regency_id: DataTypes.INTEGER,
    entity_sub_district_id: DataTypes.INTEGER,
    entity_sub_district_name: DataTypes.STRING,
    entity_village_id: DataTypes.BIGINT,
    entity_village_name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'StockInterval',
    underscored: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  })

  return StockInterval
}
