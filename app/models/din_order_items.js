'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class DinOrderItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  DinOrderItem.init({
    din_order_id: DataTypes.INTEGER,
    produk: DataTypes.STRING,
    kfa_code: DataTypes.STRING,
    expired_date: DataTypes.DATE,
    jm_vial: DataTypes.INTEGER,
    jm_dosis: DataTypes.INTEGER,
    jm_vial_terima: DataTypes.INTEGER,
    jm_dosis_terima: DataTypes.INTEGER,
    entrance_type: DataTypes.STRING,
    grant_country: DataTypes.STRING,
    manufacture_country: DataTypes.STRING,
    no_batch: DataTypes.STRING,
    released_date: DataTypes.DATE,

    production_date: DataTypes.DATE,
    unit_price: DataTypes.INTEGER,
    total_price: DataTypes.INTEGER,
    unit: DataTypes.STRING,
    tanggal_release: DataTypes.DATE,
    keterangan : DataTypes.STRING,
    note: DataTypes.STRING,
    lot_no: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'DinOrderItem',
    tableName: 'din_order_items',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  })
  return DinOrderItem
}