import sequelizePaginate from 'sequelize-paginate'
import { Model } from 'sequelize'

export default (sequelize, DataTypes) => {
  class MasterTarget extends Model {}

  MasterTarget.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'MasterTarget',
      tableName: 'master_target',
      updatedAt: 'updated_at',
      createdAt: 'created_at',
    }
  )

  sequelizePaginate.paginate(MasterTarget)

  MasterTarget.getBasicAttribute = function () {
    return [
      'id',
      'name',
    ]
  }

  return MasterTarget
}
