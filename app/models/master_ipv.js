import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MasterIPV extends Model {
    static associate(models) {
      this.belongsTo(models.Material, {
        as: 'material',
        foreignKey: 'material_id',
      })
      this.belongsTo(models.MasterMaterial, {
        as: 'master_material',
        foreignKey: 'master_material_id',
      })
      this.belongsTo(models.MasterActivity, {
        as: 'activity',
        foreignKey: 'activity_id',
      })
      
      this.belongsTo(models.User, { as: 'user_created_by', foreignKey: 'created_by' })
      this.belongsTo(models.User, { as: 'user_updated_by', foreignKey: 'updated_by' })
    }
  }

  MasterIPV.init(
    {
      material_id: DataTypes.INTEGER,
      ipv: DataTypes.DECIMAL(10,1),
      updated_by: DataTypes.INTEGER,
      created_by: DataTypes.INTEGER,
      deleted_by: DataTypes.INTEGER,
      has_ipv: DataTypes.INTEGER,
      material_name: {
        type: DataTypes.VIRTUAL,
        get() {
          let name = ''
          if(this.material) name = this.material.name
          return name
        }
      },
      master_material_id: DataTypes.INTEGER,
      activity_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'MasterIPV',
      tableName: 'master_ipvs',
      paranoid: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      deletedAt: 'deleted_at',
    }
  )

  sequelizePaginate.paginate(MasterIPV)

  return MasterIPV
}
