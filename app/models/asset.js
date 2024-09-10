import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

const userFields = ['created_by', 'updated_by', 'deleted_by']

export default (sequelize, DataTypes) => {
  class Asset extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.AssetType, { as: 'asset_type', foreignKey: 'asset_type_id' })
      this.belongsTo(models.Entity, { as: 'entity', foreignKey: 'entity_id' })
      this.belongsTo(models.User, { as: 'owner', foreignKey: 'owners_id' })
      this.belongsTo(models.User, { as: 'maintainer', foreignKey: 'maintainers_id' })

      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })
    }
  }
  Asset.init({
    serial_number: DataTypes.STRING,
    production_year: DataTypes.INTEGER,
    asset_type_id: DataTypes.INTEGER,
    entity_id: DataTypes.INTEGER,
    owners_id: DataTypes.BIGINT,
    maintainers_id: DataTypes.BIGINT,
    status: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    manufacture_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Asset',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  // 
  Asset.addHook('beforeFind', (options) => {
    const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
    if (!options.attributes) {
      options.attributes = Asset.getBasicAttribute()
    }
    if (!options.include) {
      options.include = [
        ...userFields.map(item => ({
          association: `user_${item}`,
          attributes: userAttributes
        })),
        {
          association: 'owner',
          attributes: userAttributes
        },
        {
          association: 'maintainer',
          attributes: userAttributes
        },
        {
          association: 'entity',
          attributes: ['id', 'name', 'address']
        },
        {
          association: 'asset_type',
          attributes: ['id', 'name', 'type']
        }
      ]
    }
  })
  sequelizePaginate.paginate(Asset)
  Asset.getBasicAttribute = function () {
    return [
      'id',
      'serial_number',
      'production_year',
      'asset_type_id',
      'entity_id',
      'owners_id',
      'maintainers_id',
      'status',
      'created_by',
      'updated_by',
      'deleted_by',
      'manufacture_id'
    ]
  }
  return Asset
}