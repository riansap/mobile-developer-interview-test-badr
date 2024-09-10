'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class CustomerVendor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Entity, { as: 'customer', foreignKey: 'customer_id' })
      this.belongsTo(models.Entity, { as: 'vendor', foreignKey: 'vendor_id' })
    }
  }
  CustomerVendor.init({
    customer_id: DataTypes.BIGINT,
    vendor_id: DataTypes.BIGINT,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: new Date()
    },
    is_consumption: DataTypes.TINYINT,
    is_distribution: DataTypes.TINYINT,
    is_extermination: DataTypes.TINYINT,
    customer_name: {
      type: DataTypes.VIRTUAL,
      get() {
        let name = ''
        if(this.customer) name = this.customer.name
        return name
      }
    },
    vendor_name: {
      type: DataTypes.VIRTUAL,
      get() {
        let name = ''
        if(this.vendor) name = this.vendor.name
        return name
      }
    },
  }, {
    sequelize,
    tableName: 'customer_vendors',
    modelName: 'CustomerVendor',
    underscored: true,
    timestamps: false,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
  })

  CustomerVendor.removeAttribute('id')
 // CustomerVendor.removeAttribute('created_at')
  //CustomerVendor.removeAttribute('updated_at')

  return CustomerVendor
}
