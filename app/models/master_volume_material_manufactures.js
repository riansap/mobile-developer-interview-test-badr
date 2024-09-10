import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MasterVolumeMaterialManufacture extends Model {
    static associate(models) {
      // define association here
      this.hasOne(models.MasterMaterial, {
        as: 'master_material',
        foreignKey: 'id',
        sourceKey: 'master_material_id'
      })

      this.hasOne(models.Manufacture, {
        as : 'manufacture',
        foreignKey : 'id',
        sourceKey : 'manufacture_id'
      })

      this.belongsTo(models.User, {
        as : 'user_created_by',
        foreignKey : 'created_by'
      })

      this.belongsTo(models.User, {
        as : 'user_updated_by',
        foreignKey : 'updated_by'
      })
    }
  }


  MasterVolumeMaterialManufacture.init(
    {
      master_material_id: DataTypes.INTEGER,
      manufacture_id: DataTypes.INTEGER,
      pieces_per_unit: DataTypes.DOUBLE,
      unit_per_box: DataTypes.DOUBLE,
      box_length: DataTypes.DOUBLE,
      box_width: DataTypes.DOUBLE,
      box_height: DataTypes.DOUBLE,
      created_by : DataTypes.INTEGER,
      updated_by: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'MasterVolumeMaterialManufacture',
      tableName: 'master_volume_material_manufactures',
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at'
    }
  )

  return MasterVolumeMaterialManufacture
}
